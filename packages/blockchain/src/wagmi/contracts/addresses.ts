/**
 * 환경별 컨트랙트 주소 관리
 *
 * 체인 ID:
 * - 43114: Avalanche C-Chain (메인넷)
 * - 43113: Avalanche Fuji (테스트넷)
 */

type ContractName = 'sampleToken' | 'medicalRecordStore';

type ContractAddresses = {
  [K in ContractName]: Record<number, `0x${string}`>;
};

export const contractAddresses: ContractAddresses = {
  sampleToken: {
    43114: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    43113: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  medicalRecordStore: {
    43114: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    43113: '0x2A6bB4491a2eEA1415134D058426f3fD3DbD6475' as `0x${string}`,
  },
} as const;

export function getContractAddress(
  name: ContractName,
  chainId: number,
): `0x${string}` {
  const addresses = contractAddresses[name];

  if (!addresses) {
    throw new Error(`컨트랙트 '${name}'을(를) 찾을 수 없습니다`);
  }

  const address = addresses[chainId];

  if (!address) {
    throw new Error(
      `컨트랙트 '${name}'의 체인 ID ${chainId}에 대한 주소가 정의되지 않았습니다`,
    );
  }

  return address;
}

export function hasContractAddress(
  name: ContractName,
  chainId: number,
): boolean {
  const addresses = contractAddresses[name];
  return !!(addresses && addresses[chainId]);
}
