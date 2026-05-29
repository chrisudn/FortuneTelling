/**
 * 三硬幣起卦法
 *
 * 三枚硬幣各自為陽(1)或陰(0)，統計正面數量決定爻的性質：
 *   3正面 → 老陽 (value 9)：動爻，陽變陰
 *   2正面 → 少陰 (value 8)：靜爻，維持陰
 *   1正面 → 少陽 (value 7)：靜爻，維持陽
 *   0正面 → 老陰 (value 6)：動爻，陰變陽
 *
 * 爻序：lines[0] = 初爻（最底部），lines[5] = 上爻（最頂部）
 */

export type LineType = 'oldYang' | 'youngYin' | 'youngYang' | 'oldYin'

export const LINE_LABELS: Record<LineType, string> = {
  oldYang: '老陽',
  youngYin: '少陰',
  youngYang: '少陽',
  oldYin: '老陰',
}

export const LINE_SYMBOLS: Record<LineType, string> = {
  oldYang: '━━ ×',   // 陽爻，標記變爻
  youngYin: '━ ━',   // 陰爻，靜
  youngYang: '━━━',  // 陽爻，靜
  oldYin: '━ ━ ×',  // 陰爻，標記變爻
}

export interface CastLine {
  type: LineType
  label: string   // 老陽/少陰/少陽/老陰
  symbol: string  // 顯示符號
  isChanging: boolean
  mainValue: 0 | 1   // 本卦爻值
  changedValue: 0 | 1 // 之卦爻值（有變則翻轉，無變同本卦）
}

export interface CastResult {
  lines: CastLine[]          // [初爻, 二爻, 三爻, 四爻, 五爻, 上爻]
  mainLines: (0 | 1)[]       // 本卦六爻
  changedLines: (0 | 1)[]    // 之卦六爻
  changingPositions: number[] // 0-indexed，有變爻的位置
  hasChanges: boolean
}

function throwThreeCoins(): LineType {
  const heads = Array.from({ length: 3 }, () => Math.floor(Math.random() * 2))
    .reduce((sum, coin) => sum + coin, 0)

  switch (heads) {
    case 3: return 'oldYang'
    case 2: return 'youngYin'
    case 1: return 'youngYang'
    default: return 'oldYin'
  }
}

function toMainValue(type: LineType): 0 | 1 {
  return (type === 'oldYang' || type === 'youngYang') ? 1 : 0
}

function toChangedValue(type: LineType): 0 | 1 {
  if (type === 'oldYang') return 0  // 陽 → 陰
  if (type === 'oldYin') return 1   // 陰 → 陽
  return toMainValue(type)
}

export function castHexagram(): CastResult {
  const lines: CastLine[] = Array.from({ length: 6 }, () => {
    const type = throwThreeCoins()
    return {
      type,
      label: LINE_LABELS[type],
      symbol: LINE_SYMBOLS[type],
      isChanging: type === 'oldYang' || type === 'oldYin',
      mainValue: toMainValue(type),
      changedValue: toChangedValue(type),
    }
  })

  const mainLines = lines.map(l => l.mainValue) as (0 | 1)[]
  const changedLines = lines.map(l => l.changedValue) as (0 | 1)[]
  const changingPositions = lines.reduce<number[]>((acc, l, i) => {
    if (l.isChanging) acc.push(i)
    return acc
  }, [])

  return {
    lines,
    mainLines,
    changedLines,
    changingPositions,
    hasChanges: changingPositions.length > 0,
  }
}

/** 爻位中文名稱（0=初爻，5=上爻） */
export const YAO_POSITION_NAMES = ['初', '二', '三', '四', '五', '上']
