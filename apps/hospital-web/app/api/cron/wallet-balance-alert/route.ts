import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { createPublicViemClient } from '@mire/blockchain/viem/clients';
import { avalanche, avalancheFuji } from '@mire/blockchain/wagmi/chains';
import { formatEther } from 'viem';
import { sendWalletLowBalanceEmail } from '@/lib/send-email';

const CRON_SECRET_HEADER = 'x-cron-secret';

// 주기적 잔액 체크 + 최소 잔액 미만 시 이메일 알림 (Cron 전용)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  const secret = request.headers.get(CRON_SECRET_HEADER) ?? bearerToken;

  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const walletAddress = process.env.MASTER_WALLET_ADDRESS as
    | `0x${string}`
    | undefined;

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json(
      { ok: false, reason: 'MASTER_WALLET_ADDRESS not configured' },
      { status: 200 },
    );
  }

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  const chain = chainId === '43113' ? avalancheFuji : avalanche;
  const networkName =
    chainId === '43113' ? 'Avalanche Fuji Testnet' : 'Avalanche C-Chain';

  try {
    const publicClient = createPublicViemClient(chain);
    const balanceWei = await publicClient.getBalance({
      address: walletAddress,
    });
    const balanceFormatted = formatEther(balanceWei);
    const balanceAvax = parseFloat(balanceFormatted);

    const row = await prisma.walletNotificationSetting.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!row?.notificationEmail?.trim()) {
      return NextResponse.json(
        { ok: true, message: 'No notification email configured' },
        { status: 200 },
      );
    }

    const thresholdAvax = parseFloat(row.minBalanceAvax) || 0;
    const to = row.notificationEmail.trim();

    if (balanceAvax >= thresholdAvax) {
      if (row.lastLowBalanceAlertedAt) {
        await prisma.walletNotificationSetting.update({
          where: { id: row.id },
          data: { lastLowBalanceAlertedAt: null },
        });
      }
      return NextResponse.json(
        {
          ok: true,
          balanceAvax,
          thresholdAvax,
          message: 'Balance above threshold, no alert sent',
        },
        { status: 200 },
      );
    }

    if (row.lastLowBalanceAlertedAt) {
      return NextResponse.json(
        {
          ok: true,
          balanceAvax,
          thresholdAvax,
          message: 'Already alerted for this low balance period',
        },
        { status: 200 },
      );
    }

    await sendWalletLowBalanceEmail({
      to,
      balanceAvax: balanceFormatted,
      thresholdAvax: row.minBalanceAvax,
      networkName,
    });

    await prisma.walletNotificationSetting.update({
      where: { id: row.id },
      data: { lastLowBalanceAlertedAt: new Date() },
    });

    return NextResponse.json(
      {
        ok: true,
        balanceAvax,
        thresholdAvax,
        message: 'Low balance alert email sent',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[cron/wallet-balance-alert]', error);
    return NextResponse.json(
      { ok: false, error: 'Check failed' },
      { status: 500 },
    );
  }
}
