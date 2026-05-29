import type { CastSession } from './storage'
import type { ReadingResult } from './hexagram'
import type { DiaryEntry } from './diary'

const YAO_NAMES = ['初', '二', '三', '四', '五', '上']

export function buildHexagramContext(
  session: CastSession,
  reading: ReadingResult,
  recentEntries?: DiaryEntry[]
): string {
  const { mainHexagram, changedHexagram, changingYaoCi } = reading
  const lines: string[] = []

  lines.push(`用戶問題：${session.question}`)
  lines.push('')
  lines.push(`本卦：${mainHexagram.name}（${mainHexagram.upperTrigram}上${mainHexagram.lowerTrigram}下）`)
  lines.push(`卦辭：${mainHexagram.guaCi}`)
  lines.push(`大象傳：${mainHexagram.image}`)

  if (session.hasChanges && changingYaoCi.length > 0) {
    const posLabels = session.changingPositions.map(p => YAO_NAMES[p] + '爻').join('、')
    lines.push('')
    lines.push(`動爻（${posLabels}）：`)
    changingYaoCi.forEach(y => lines.push(`  ${y.position}：${y.text}`))
  }

  if (changedHexagram) {
    lines.push('')
    lines.push(`之卦：${changedHexagram.name}（${changedHexagram.altName}）`)
    lines.push(`之卦卦辭：${changedHexagram.guaCi}`)
  }

  if (!session.hasChanges) {
    lines.push('')
    lines.push('（此為靜卦，六爻安定，無動爻）')
  }

  // 附帶歷史脈絡（暱稱用戶專屬）
  if (recentEntries && recentEntries.length > 0) {
    lines.push('')
    lines.push('【此用戶近期的占卜紀錄，供參考以展現對其的了解】')
    recentEntries.slice(0, 3).forEach((e, i) => {
      const date = new Date(e.savedAt).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })
      const hexInfo = e.changedHexagramName
        ? `${e.mainHexagramName}卦→${e.changedHexagramName}卦`
        : `${e.mainHexagramName}卦（靜）`
      lines.push(`  ${i + 1}. （${date}）問：${e.question}　卦：${hexInfo}`)
    })
    lines.push('（請自然地在解讀中體現對用戶的了解，但仍以本次卦象為主）')
  }

  lines.push('')
  lines.push('請針對用戶的問題，結合以上卦象，給予洞察與建議。')

  return lines.join('\n')
}
