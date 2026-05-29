# Changelog

所有版本紀錄依照 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 格式撰寫。

---

## [0.1.0] — 2026-05-29　MVP 完成

首個完整可運作版本，包含完整占卜流程、AI 解讀對話、暱稱日記系統。

### 新增

**Phase 0 — 基礎建設**
- `doc/hexagrams/hexagrams.json`：64 卦完整資料（卦辭、大象傳、6 條爻辭）
- `doc/hexagrams/all64.md`：64 卦備查文件
- `doc/development-plan.md`：完整開發計畫與各 Phase 驗收檢核表
- `src/lib/casting.ts`：三硬幣起卦算法（老陽/少陰/少陽/老陰，自動計算本卦+之卦+動爻）
- `src/lib/hexagram.ts`：64 卦查詢邏輯（根據爻陣列反查卦名、卦辭、爻辭）
- `scripts/verify-phase0.mjs`：Phase 0 驗收腳本（6 項自動測試）

**Phase 1 — 核心占卜流程**
- `src/app/page.tsx`：首頁，問題輸入 + 起卦按鈕
- `src/app/cast/page.tsx`：起卦動畫頁，逐爻呈現（0.65 秒間隔，動爻紅色標示）
- `src/app/result/page.tsx`：卦象結果頁（本卦卦象圖、卦辭、動爻爻辭、之卦、展開爻辭）
- `src/components/YaoLine.tsx`：單爻 CSS 視覺元件（陽爻/陰爻/動爻）
- `src/components/HexagramDisplay.tsx`：六爻卦象圖形元件（上爻在頂，初爻在底）
- `src/lib/storage.ts`：占卜 session sessionStorage 操作

**Phase 2 — AI 解讀對話**
- `src/app/api/oracle/route.ts`：OpenAI gpt-4o-mini Streaming API Route
- `src/lib/buildContext.ts`：組裝卦象 Prompt Context（問題 + 卦辭 + 動爻 + 之卦）
- `src/components/ChatSection.tsx`：AI 對話 UI（Streaming 逐字顯示、輪次限制、錯誤處理）
- 訪客 3 輪對話，易經智慧導師系統 Prompt

**Phase 3 — 暱稱身分 + 日記儲存**
- `src/lib/diary.ts`：Profile + DiaryEntry localStorage CRUD 操作
- `src/app/profile/page.tsx`：暱稱建立 / 個人資訊頁
- `src/app/history/page.tsx`：占卜歷史列表（倒序、含日記預覽）
- `src/app/history/[id]/page.tsx`：日記詳情頁（含心情筆記編輯）
- `src/components/NavBar.tsx`：底部三 Tab 導覽列（問卦 / 歷史 / 我的）
- 暱稱用戶 AI 對話延長至 10 輪
- AI Context 附帶最近 3 筆占卜歷史（展現「認識你」的感覺）
- 結果頁「儲存此次占卜」按鈕，儲存後自動帶入 AI 第一輪回應

**Phase 4 — 視覺精修 + 無障礙**
- 宣紙橫紋 CSS 背景紋理（模擬中式書紙）
- 全站 `focus-visible` 硃砂紅外框（無障礙）
- iOS 防自動縮放（`font-size: max(16px, 1em)`）
- NavBar active 頂部指示線、`aria-label`、`aria-current`
- 首頁古典 ☯ 裝飾分隔線
- 修正全站低對比色（`/30`、`/40` → `/60` 以上）
- 修正所有 `text-xs`/`text-sm` 內容文字升為 `text-base`（16px+）
- 按鈕 `aria-disabled`、textarea `aria-live`、form `htmlFor` 關聯

### 技術規格
- Next.js 14.2.35 + App Router
- React 18
- Tailwind CSS 3.4
- OpenAI SDK 6.x（gpt-4o-mini）
- TypeScript 5（strict mode）
- 無後端（localStorage MVP）

---

## 未來版本規劃

### [0.2.0] — 後端與多裝置同步（未開始）
- 正式用戶系統（Email / 手機號登入）
- PostgreSQL 資料庫替代 localStorage
- 多裝置資料同步

### [0.3.0] — 進階功能（未開始）
- AI 解讀歷史趨勢分析（「你這個月常問感情問題…」）
- 占卜結果生成圖片分享
- 進階變爻解卦規則（6 爻全動、用九/用六）
- 推播提醒
