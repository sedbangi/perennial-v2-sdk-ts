import { Hex, toHex } from 'viem'

export const GraphDefaultPageSize = 1000
export async function queryAll<T extends { [key: string]: any }>(query: (page: number) => Promise<T>): Promise<T> {
  const hasMore = (data: T) =>
    !Object.values(data)
      .filter((d) => Array.isArray(d))
      .every((i) => i.length < GraphDefaultPageSize)
  const merge = (data: T, incoming: T) =>
    Object.keys(data).reduce((ret, key) => {
      if (!Array.isArray(data[key])) return { ...ret, [key]: ret[key] || data[key] }
      return { ...ret, [key]: [...data[key], ...incoming[key]] }
    }, {} as T)

  let page = 0
  let data = await query(page)
  let incoming = data
  while (hasMore(incoming)) {
    page += 1
    incoming = await query(page)
    data = merge(data, incoming)
  }

  return data
}

export function bigIntToLittleEndian(value: bigint, size: number): Hex {
  const hex = toHex(value, { size })
  return `0x${hex.slice(2).match(/.{2}/g)!.reverse().join('')}`
}
