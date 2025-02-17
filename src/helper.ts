import { IPoint } from "./models";

const CORE_VAULT_STRATEGY_ADDRESS = "0xcd6d74b6852fbeeb1187ec0e231ab91e700ec3ba"
export const filterPoint = (data: IPoint[]) => {
  return data.filter(item => item.holder.toLowerCase() !== CORE_VAULT_STRATEGY_ADDRESS)
}
