import { ChainMarketSnapshot } from '../lib'
import { JumpRateUtilizationCurve } from '../types/perennial'
import { Big6Math } from './big6Utils'
import { nowSeconds } from './timeUtils'

export const computeInterestRate = (curve: JumpRateUtilizationCurve, utilization: bigint) => {
  if (utilization < Big6Math.ZERO) return curve.minRate

  if (utilization < curve.targetUtilization)
    return linearInterpolation(Big6Math.ZERO, curve.minRate, curve.targetUtilization, curve.targetRate, utilization)

  if (utilization < Big6Math.ONE)
    return linearInterpolation(curve.targetUtilization, curve.targetRate, Big6Math.ONE, curve.maxRate, utilization)

  return curve.maxRate
}

function linearInterpolation(startX: bigint, startY: bigint, endX: bigint, endY: bigint, targetX: bigint) {
  if (targetX < startX || targetX > endX) throw 'CurveMath18OutOfBoundsError'

  const xRange = endX - startX
  const yRange = endY - startY
  const xRatio = Big6Math.div(targetX - startX, xRange)
  return Big6Math.mul(yRange, xRatio) + startY
}

/**
 * Calculates the funding for each side of the market
 * @param snapshot
 * @returns The long, short and maker funding + interest rates, along with per side funding and interest rates.
 *          Negative values indicate receiving, positive values indicate paying.
 */
export function calculateFundingAndInterestForSides(snapshot: ChainMarketSnapshot) {
  const {
    global: { pAccumulator },
    parameter: { fundingFee, interestFee },
    riskParameter: { pController, utilizationCurve, efficiencyLimit },
    nextPosition: { maker, long, short, timestamp },
  } = snapshot

  // Funding
  const timeDelta = BigInt(nowSeconds()) - timestamp
  const marketFunding = pAccumulator._value + Big6Math.mul(timeDelta, Big6Math.div(pAccumulator._skew, pController.k))
  const funding = Big6Math.max(Big6Math.min(marketFunding, pController.max), pController.min)
  const major = Big6Math.max(long, short)
  const minor = Big6Math.min(long, short)
  // Interest
  const netUtilization = maker + minor > 0n ? Big6Math.div(major, maker + minor) : 0n
  const efficiencyUtilization =
    maker > 0n ? Big6Math.mul(major, Big6Math.div(efficiencyLimit, maker)) : 100n * Big6Math.ONE
  const utilization = Big6Math.min(100n * Big6Math.ONE, Big6Math.max(netUtilization, efficiencyUtilization))
  const interestRate = computeInterestRate(utilizationCurve, utilization)
  const applicableNotional = Big6Math.min(maker, long + short)
  const interest = long + short > 0n ? Big6Math.div(Big6Math.mul(interestRate, applicableNotional), long + short) : 0n
  const totalInterestFee = Big6Math.mul(interest, interestFee)

  const totalFundingFee = Big6Math.mul(Big6Math.abs(funding), fundingFee) / 2n
  const longFunding = funding + totalFundingFee
  const shortFunding = -funding + totalFundingFee

  const makerUtil =
    maker > 0n ? Big6Math.max(Big6Math.min(Big6Math.div(long - short, maker), Big6Math.ONE), -Big6Math.ONE) : 0n
  const makerFunding = Big6Math.mul(makerUtil, funding)
  const makerFundingFee = Big6Math.mul(Big6Math.abs(makerUtil), totalFundingFee)
  const makerRate = (makerFunding - makerFundingFee + (interest - totalInterestFee)) * -1n

  return {
    long: longFunding + interest,
    short: shortFunding + interest,
    maker: makerRate,
    fundingRates: {
      long: funding + totalFundingFee,
      short: -funding + totalFundingFee,
      maker: -1n * (makerFunding - makerFundingFee),
    },
    interestRates: {
      long: interest,
      short: interest,
      maker: -1n * (interest - totalInterestFee),
    },
  }
}
