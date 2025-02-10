import axios from "axios"
export const getCheckStaked = (evmAddress: string) => {
    return Promise.allSettled([
        axios.get(
            `${process.env.MARKETPLACE_ENDPOINT_API}/check-staked/${evmAddress}`
        ),
        axios.get(`${process.env.VAULT_ENDPOINT_API}/check-staked/${evmAddress}`),
    ])
}
