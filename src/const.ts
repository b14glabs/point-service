import dotenv from 'dotenv'
dotenv.config()

export const DUAL_CORE_ADDRESS = '0xc5555eA27e63cd89f8b227deCe2a3916800c0f4F'
export const VAULT_ADDRESS = '0xee21ab613d30330823D35Cf91A84cE964808B83F'
export const chainId = process.env.IS_MAINNET === 'true' ? '0x45c' : '0x458' // mainnet and devnet
export const RPC_URL = process.env.RPC_URL
