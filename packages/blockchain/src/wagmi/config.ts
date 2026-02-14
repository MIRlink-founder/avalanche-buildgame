import {
  createConfig,
  cookieStorage,
  createStorage,
  fallback,
  http,
} from 'wagmi'
import { avalanche, avalancheFuji } from './chains'

/**
 * wagmi 설정 (SSR 호환)
 *
 * - ssr: true로 서버 사이드 렌더링 지원
 * - cookieStorage로 브라우저와 서버 간 상태 동기화
 * - fallback transport로 다중 RPC 엔드포인트 장애 대응
 */
export const config = createConfig({
  chains: [avalanche, avalancheFuji],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [avalanche.id]: fallback(
      [
        http(
          process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL ||
            'https://api.avax.network/ext/bc/C/rpc'
        ),
        http('https://avalanche-c-chain-rpc.publicnode.com'),
        http('https://1rpc.io/avax/c'),
      ],
      {
        rank: true,
        retryCount: 3,
      }
    ),
    [avalancheFuji.id]: http(
      process.env.NEXT_PUBLIC_FUJI_RPC_URL ||
        'https://api.avax-test.network/ext/bc/C/rpc'
    ),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
