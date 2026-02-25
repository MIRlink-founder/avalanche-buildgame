import { NextResponse } from 'next/server';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';
import { createPublicViemClient } from '@mire/blockchain/viem/clients';
import { avalanche, avalancheFuji } from '@mire/blockchain/wagmi/chains';
import { formatEther } from 'viem';

/** 지갑 연결 정보 및 현재 잔액 조회 (운영사 관리자 전용) */
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const walletAddress = process.env.MASTER_WALLET_ADDRESS as
      | `0x${string}`
      | undefined;

    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
    const networkName =
      chainId === '43113'
        ? 'Avalanche Fuji Testnet'
        : chainId === '43114'
          ? 'Avalanche C-Chain'
          : 'Avalanche C-Chain';
    const symbol = avalancheFuji.nativeCurrency.symbol;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({
        network: networkName,
        walletAddress: null,
        maskedAddress: null,
        balanceFormatted: '0',
        symbol,
      });
    }

    const client = createPublicViemClient(avalancheFuji);
    const balance = await client.getBalance({ address: walletAddress });
    const balanceFormatted = formatEther(balance);

    const maskedAddress =
      walletAddress.slice(0, 5) + '...' + walletAddress.slice(-4);

    return NextResponse.json({
      network: networkName,
      walletAddress,
      maskedAddress,
      balanceFormatted,
      symbol,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: '지갑 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
