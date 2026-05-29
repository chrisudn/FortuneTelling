import hexagramsData from '../../doc/hexagrams/hexagrams.json'

export interface TrigramInfo {
  symbol: string
  nature: string     // 天/地/雷/風/水/火/山/澤
  attribute: string  // 健/順/動/入/陷/麗/止/說
}

const trigrams = hexagramsData.trigrams as Record<string, TrigramInfo>

export function getTrigramInfo(name: string): TrigramInfo | null {
  return trigrams[name] ?? null
}
