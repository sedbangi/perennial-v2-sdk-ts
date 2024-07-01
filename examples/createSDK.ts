import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { getAddress } from 'viem'

import Perennial, { ChainMarkets, Day, SupportedAsset } from '../'

dotenvConfig({ path: path.resolve(__dirname, '../.env.local') })
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

async function run() {
  const markets = [SupportedAsset.eth, SupportedAsset.btc, SupportedAsset.sol]
  const address = getAddress('0x1deFb9E9aE40d46C358dc0a185408dc178483851')
  const sdk = new Perennial({
    chainId: 42161,
    rpcUrl: process.env.RPC_URL_ARBITRUM!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM_NEW!,
    pythUrl: process.env.PYTH_URL!,
    operatingFor: address,
    supportedMarkets: markets,
  })
  const marketSnapshots = await sdk.markets.read.marketSnapshots()

  const activePositionPnlData = await sdk.markets.read.activePositionsPnl({
    marketSnapshots,
  })

  console.log(activePositionPnlData)
}

run()
