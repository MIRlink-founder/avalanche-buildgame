import { createPublicClient, createWalletClient, http, type Chain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { avalanche } from '../wagmi/chains'

/**
 * 프라이빗키 기반 Wallet Client 생성 유틸리티
 *
 * Server Actions에서만 사용하세요.
 * 프라이빗키는 절대 클라이언트에 노출하지 마세요.
 */
export function createLocalWalletClient(
  privateKey: `0x${string}`,
  chain: Chain = avalanche
) {
  const account = privateKeyToAccount(privateKey)

  return createWalletClient({
    account,
    chain,
    transport: http(),
  })
}

/**
 * Public Client 생성 유틸리티
 *
 * 읽기 전용 블록체인 데이터 조회에 사용합니다.
 * Server/Client 모두 사용 가능합니다.
 */
export function createPublicViemClient(chain: Chain = avalanche) {
  return createPublicClient({
    chain,
    transport: http(),
  })
}
