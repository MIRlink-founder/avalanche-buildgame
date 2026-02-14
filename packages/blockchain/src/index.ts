// wagmi
export { config } from './wagmi/config'
export { avalanche, avalancheFuji } from './wagmi/chains'
export { erc20Abi } from './wagmi/contracts/abis'
export {
  contractAddresses,
  getContractAddress,
  hasContractAddress,
} from './wagmi/contracts/addresses'

// viem
export {
  createLocalWalletClient,
  createPublicViemClient,
} from './viem/clients'
