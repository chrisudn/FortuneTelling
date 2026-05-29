import hexagramsData from '../../doc/hexagrams/hexagrams.json'

export interface YaoCi {
  position: string
  text: string
}

export interface Hexagram {
  id: number
  name: string
  altName: string
  unicode: string
  pinyin: string
  upperTrigram: string
  lowerTrigram: string
  lines: (0 | 1)[]
  guaCi: string
  image: string
  keyword: string
  yaoCi: YaoCi[]
  specialLine?: YaoCi
}

export interface ReadingResult {
  mainHexagram: Hexagram
  changedHexagram: Hexagram | null  // null 表示靜卦（無變爻）
  changingYaoCi: YaoCi[]            // 變爻對應的爻辭（按爻位順序）
}

/** 根據六爻陣列查找對應卦象（lines[0]=初爻，lines[5]=上爻） */
export function findHexagramByLines(lines: (0 | 1)[]): Hexagram | undefined {
  return (hexagramsData.hexagrams as Hexagram[]).find(h =>
    h.lines.every((v, i) => v === lines[i])
  )
}

export function getHexagramById(id: number): Hexagram | undefined {
  return (hexagramsData.hexagrams as Hexagram[]).find(h => h.id === id)
}

/**
 * 根據本卦爻值、之卦爻值、變爻位置，組合完整解讀結果
 *
 * @param mainLines    本卦六爻 [初爻…上爻]
 * @param changedLines 之卦六爻 [初爻…上爻]
 * @param changingPositions 變爻的 0-indexed 位置
 */
export function buildReadingResult(
  mainLines: (0 | 1)[],
  changedLines: (0 | 1)[],
  changingPositions: number[]
): ReadingResult | null {
  const mainHexagram = findHexagramByLines(mainLines)
  if (!mainHexagram) return null

  const hasChanges = changingPositions.length > 0
  const changedHexagram = hasChanges
    ? (findHexagramByLines(changedLines) ?? null)
    : null

  const changingYaoCi = changingPositions
    .map(pos => mainHexagram.yaoCi[pos])
    .filter(Boolean)

  return { mainHexagram, changedHexagram, changingYaoCi }
}

/** 取得完整的 64 卦列表（供歷史頁、選單等使用） */
export function getAllHexagrams(): Hexagram[] {
  return hexagramsData.hexagrams as Hexagram[]
}
