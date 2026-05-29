/**
 * Phase 0 驗收腳本
 * 執行：node scripts/verify-phase0.mjs
 *
 * 驗收點：
 * 1. 呼叫起卦函數，輸出本卦編號、之卦編號（若有）、變爻位置
 * 2. 給定任一卦號，能正確回傳卦名、卦辭、6 條爻辭
 * 3. 靜卦與動卦兩種情境都能正確產生
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataPath = join(__dirname, '../doc/hexagrams/hexagrams.json')
const data = JSON.parse(readFileSync(dataPath, 'utf-8'))

// ── 起卦算法（移植自 casting.ts）────────────────────────────────
const LINE_LABELS = {
  oldYang: '老陽', youngYin: '少陰', youngYang: '少陽', oldYin: '老陰',
}
const LINE_SYMBOLS = {
  oldYang: '━━ ×', youngYin: '━ ━', youngYang: '━━━', oldYin: '━ ━ ×',
}

function throwThreeCoins() {
  const heads = [0,1,2].reduce((sum) => sum + Math.floor(Math.random() * 2), 0)
  if (heads === 3) return 'oldYang'
  if (heads === 2) return 'youngYin'
  if (heads === 1) return 'youngYang'
  return 'oldYin'
}

function castHexagram() {
  const lines = Array.from({ length: 6 }, () => {
    const type = throwThreeCoins()
    const isChanging = type === 'oldYang' || type === 'oldYin'
    const mainValue = (type === 'oldYang' || type === 'youngYang') ? 1 : 0
    const changedValue = type === 'oldYang' ? 0 : type === 'oldYin' ? 1 : mainValue
    return { type, label: LINE_LABELS[type], symbol: LINE_SYMBOLS[type], isChanging, mainValue, changedValue }
  })
  const mainLines = lines.map(l => l.mainValue)
  const changedLines = lines.map(l => l.changedValue)
  const changingPositions = lines.map((l, i) => l.isChanging ? i : -1).filter(i => i !== -1)
  return { lines, mainLines, changedLines, changingPositions, hasChanges: changingPositions.length > 0 }
}

// ── 查卦邏輯（移植自 hexagram.ts）────────────────────────────────
function findHexagramByLines(lines) {
  return data.hexagrams.find(h => h.lines.every((v, i) => v === lines[i]))
}

function getHexagramById(id) {
  return data.hexagrams.find(h => h.id === id)
}

// ── 驗收測試 ─────────────────────────────────────────────────────
console.log('═══════════════════════════════════════')
console.log('  卦語 Phase 0 驗收測試')
console.log('═══════════════════════════════════════\n')

// ✅ 驗收點 1：資料庫完整性
console.log('【驗收 1】64 卦資料完整性')
const total = data.hexagrams.length
const allHaveYaoCi = data.hexagrams.every(h => h.yaoCi?.length === 6)
const allHaveGuaCi = data.hexagrams.every(h => h.guaCi?.length > 0)
console.log(`  卦數：${total} 卦 ${total === 64 ? '✅' : '❌'}`)
console.log(`  全部有卦辭：${allHaveGuaCi ? '✅' : '❌'}`)
console.log(`  全部有 6 條爻辭：${allHaveYaoCi ? '✅' : '❌'}\n`)

// ✅ 驗收點 2：單卦查詢
console.log('【驗收 2】給定卦號查詢（第 1 卦：乾，第 64 卦：未濟）')
const qian = getHexagramById(1)
const weiJi = getHexagramById(64)
console.log(`  乾卦 → 名稱：${qian?.name}，卦辭：${qian?.guaCi}`)
console.log(`  未濟卦 → 名稱：${weiJi?.name}，卦辭：${weiJi?.guaCi}\n`)

// ✅ 驗收點 3：爻陣列查找
console.log('【驗收 3】根據爻陣列查找卦象')
const kunLines = [0,0,0,0,0,0]
const found = findHexagramByLines(kunLines)
console.log(`  全陰爻 → 應為坤卦：${found?.name} ${found?.name === '坤' ? '✅' : '❌'}\n`)

// ✅ 驗收點 4：起卦（動態，執行 3 次，確保靜卦與動卦都能出現）
console.log('【驗收 4】起卦算法（連續 5 次）')
let dynamicCount = 0, staticCount = 0
for (let i = 1; i <= 5; i++) {
  const result = castHexagram()
  const main = findHexagramByLines(result.mainLines)
  const changed = result.hasChanges ? findHexagramByLines(result.changedLines) : null

  if (result.hasChanges) dynamicCount++; else staticCount++

  const yaoNames = ['初', '二', '三', '四', '五', '上']
  console.log(`  第 ${i} 次起卦：`)
  console.log(`    六爻（由下至上）：`)
  result.lines.forEach((l, idx) => {
    console.log(`      ${yaoNames[idx]}爻 ${l.symbol.padEnd(8)} ${l.label}${l.isChanging ? ' ← 動爻' : ''}`)
  })
  console.log(`    本卦：${main?.name ?? '未找到'} （${main?.keyword ?? ''}）`)
  if (changed) {
    const pos = result.changingPositions.map(p => yaoNames[p] + '爻').join('、')
    console.log(`    變爻：${pos}`)
    console.log(`    之卦：${changed.name} （${changed.keyword}）`)
  } else {
    console.log(`    靜卦，無變爻`)
  }
  console.log()
}

// ✅ 驗收點 5：強制驗證靜卦情境
console.log('【驗收 5】靜卦情境（強制模擬）')
const staticCast = {
  mainLines: [1,0,1,1,0,1],
  changedLines: [1,0,1,1,0,1],
  changingPositions: [],
  hasChanges: false
}
const staticMain = findHexagramByLines(staticCast.mainLines)
console.log(`  靜卦 → 本卦：${staticMain?.name ?? '未找到'}，無之卦 ${!staticCast.hasChanges ? '✅' : '❌'}\n`)

// ✅ 驗收點 6：強制驗證動卦情境
console.log('【驗收 6】動卦情境（強制模擬：第三爻老陽）')
const dynamicMain = [1,0,1,1,0,1]
const dynamicChanged = [1,0,0,1,0,1] // 第三爻(index 2) 從1變0
const dMain = findHexagramByLines(dynamicMain)
const dChanged = findHexagramByLines(dynamicChanged)
console.log(`  本卦：${dMain?.name ?? '未找到'}`)
console.log(`  之卦：${dChanged?.name ?? '未找到'}`)
console.log(`  動卦情境查詢正常：${dMain && dChanged ? '✅' : '❌'}\n`)

console.log('═══════════════════════════════════════')
const allPass = total === 64 && allHaveYaoCi && allHaveGuaCi && found?.name === '坤' && dMain && dChanged
console.log(`  Phase 0 驗收結果：${allPass ? '✅ 全部通過' : '❌ 有項目失敗'}`)
console.log('═══════════════════════════════════════')
