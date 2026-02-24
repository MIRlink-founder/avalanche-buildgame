import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@mire/database';
import { AuthError, requireAuth } from '@/lib/auth-guard';
import { encryptLayer2, encryptLayer3 } from '@/lib/records-encrypt-server';
import { getContractAddress } from '@mire/blockchain/wagmi/contracts/addresses';
import { medicalRecordStoreAbi } from '@mire/blockchain/wagmi/contracts/abis';
import {
  createLocalWalletClient,
  createPublicViemClient,
} from '@mire/blockchain/viem/clients';
import { avalanche, avalancheFuji } from '@mire/blockchain/wagmi/chains';
import { writeContract, waitForTransactionReceipt } from 'viem/actions';

export const runtime = 'nodejs';

/** 진료 기록 등록: 1차 암호문(cipher1) 수신 → 2·3차 암호화 → DB 저장 → 컨트랙트 이벤트 저장 */
export async function POST(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const hospitalId = user.hospitalId;
    const doctorId = user.id;
    if (!hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const patientId =
      typeof body?.patientId === 'string' ? body.patientId.trim() : '';
    const encryptedPayload =
      typeof body?.encryptedPayload === 'string'
        ? body.encryptedPayload.trim()
        : '';
    if (!patientId || !encryptedPayload) {
      return NextResponse.json(
        { error: 'patientId와 encryptedPayload가 필요합니다.' },
        { status: 400 },
      );
    }

    const salt = process.env.MEDICAL_RECORD_ENCRYPTION_SALT;
    if (!salt) {
      return NextResponse.json(
        { error: '서버 암호화 설정이 없습니다.' },
        { status: 500 },
      );
    }

    const rawKey = process.env.MASTER_WALLET_PRIVATE_KEY?.trim();
    if (!rawKey) {
      return NextResponse.json(
        { error: '블록체인 지갑 설정이 없습니다.' },
        { status: 500 },
      );
    }
    const privateKey = rawKey.startsWith('0x')
      ? (rawKey as `0x${string}`)
      : (`0x${rawKey}` as `0x${string}`);

    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '43113', 10);
    const chain = chainId === 43114 ? avalanche : avalancheFuji;
    const contractAddress = getContractAddress('medicalRecordStore', chainId);

    const cipher2 = encryptLayer2(encryptedPayload, patientId);
    const cipher3 = encryptLayer3(cipher2, salt);
    const cipher3Buffer = Buffer.from(cipher3, 'base64');
    const dataHashHex = createHash('sha256')
      .update(cipher3Buffer)
      .digest('hex');
    const dataHashBytes32 = `0x${dataHashHex}` as `0x${string}`;
    const encryptedPayloadHex =
      `0x${cipher3Buffer.toString('hex')}` as `0x${string}`;

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        patientId,
        hospitalId,
        doctorId,
        departmentId: null,
        encryptedChartData: cipher3,
        status: 'PAID',
      },
    });

    const walletClient = createLocalWalletClient(privateKey, chain);
    const publicClient = createPublicViemClient(chain);
    const account = walletClient.account;
    if (!account) {
      return NextResponse.json(
        { error: '블록체인 지갑 계정이 없습니다.' },
        { status: 500 },
      );
    }
    const hash = await writeContract(walletClient, {
      address: contractAddress,
      abi: medicalRecordStoreAbi,
      functionName: 'storeRecord',
      args: [BigInt(medicalRecord.id), dataHashBytes32, encryptedPayloadHex],
      account,
    });

    const receipt = await waitForTransactionReceipt(publicClient, { hash });
    const status = receipt.status === 'success' ? 'CONFIRMED' : 'FAILED';
    const gasUsed = receipt.gasUsed ?? undefined;

    await prisma.blockchainTransaction.create({
      data: {
        medicalRecordId: medicalRecord.id,
        txHash: hash,
        dataHash: dataHashHex,
        blockNumber: receipt.blockNumber,
        gasUsed,
        status,
      },
    });

    if (status === 'CONFIRMED') {
      await prisma.medicalRecord.update({
        where: { id: medicalRecord.id },
        data: { status: 'ON-CHAINED' },
      });
    }

    return NextResponse.json({
      success: true,
      medicalRecordId: medicalRecord.id,
      txHash: hash,
      gasUsed: gasUsed != null ? String(gasUsed) : null,
      status,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
