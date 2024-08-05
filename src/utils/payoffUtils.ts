import { Big6Math } from './big6Utils'
import { Big18Math } from './big18Utils'

export const linearTransform = (value18: bigint) => Big18Math.toDecimals(value18, Big6Math.FIXED_DECIMALS)
export const linearUntransform = (value6: bigint) => value6

export const microPowerTwoTransform = (value18: bigint) =>
  Big18Math.toDecimals(
    Big18Math.div(Big18Math.mul(value18, value18), Big18Math.fromFloatString('1000000')),
    Big6Math.FIXED_DECIMALS,
  )
export const microPowerTwoUntransform = (value6: bigint) => Big6Math.sqrt(value6 * Big6Math.fromFloatString('1000000'))

export const centimilliPowerTwoTransform = (value18: bigint) =>
  Big18Math.toDecimals(
    Big18Math.div(Big18Math.mul(value18, value18), Big18Math.fromFloatString('100000')),
    Big6Math.FIXED_DECIMALS,
  )
export const centimilliPowerTwoUntransform = (value6: bigint) =>
  Big6Math.sqrt(value6 * Big6Math.fromFloatString('100000'))

// Transforms a big6 value by the given decimals
export const decimalTransform = (decimals: bigint) => (value18: bigint) => {
  const base = Big18Math.fromDecimals(10n ** Big18Math.abs(decimals), 0)
  return Big18Math.toDecimals(
    decimals < 0 ? Big18Math.div(value18, base) : Big18Math.mul(value18, base),
    Big6Math.FIXED_DECIMALS,
  )
}
export const decimalUntransform = (decimals: bigint) => (value6: bigint) => {
  const base = Big6Math.fromDecimals(10n ** Big6Math.abs(decimals), 0)
  return decimals < 0 ? Big6Math.mul(value6, base) : Big6Math.div(value6, base)
}
