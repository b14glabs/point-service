import { MarketplaceStakeEvents } from '../models/markerplaceStakeEvents.model'

export const findMarketplaceStakers = async () => {
  return MarketplaceStakeEvents.distinct('delegator')
}
