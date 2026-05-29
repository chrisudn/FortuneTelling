# Changelog

所有版本紀錄依照 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 格式撰寫。

---

## [0.4.0] — 2026-05-29　Supabase Auth + 多裝置同步

### 新增

**Sprint 1 — Supabase 基礎 + 登入頁**
- Supabase Auth 整合（`@supabase/ssr`）
- `/login` 頁面：Email 魔法連結、Email + 密碼（含忘記密碼）
- `/auth/callback` route：處理登入連結跳轉
- Next.js middleware：自動刷新 session token
- `diary_entries` PostgreSQL 資料表 + Row Level Security

**Sprint 2 — Auth 狀態整合到 UI**
- Profile 頁整合 Supabase Auth 狀態（已登入顯示 email + 登出按鈕）
- 暱稱儲存至 Supabase `user_metadata`（跨裝置保留）
- 未登入顯示「登入以同步占卜日記」引導
- 暱稱卡片顯示「☁ 雲端」標籤，區分資料來源
- `/result` 頁：登入用戶享有儲存與 AI 10 輪對話

**Sprint 3 — 日記寫入 Supabase**
- `POST /api/diary`：占卜記錄寫入 Supabase（需驗證登入）
- `PATCH /api/diary/[id]`：更新 AI 對話與心情筆記
- 已登入時「儲存此次占卜」存至 Supabase；未登入繼續存 localStorage
- Supabase 失敗時自動 fallback 至 localStorage

**Sprint 4 — 日記讀取 + 多裝置同步**
- `GET /api/diary`：讀取全部日記記錄（支援 `?limit=N`）
- `GET /api/diary/[id]`：讀取單筆記錄
- `/history` 列表：已登入時從 Supabase 讀取，未登入從 localStorage
- `/history/[id]` 詳情：同上；心情筆記修改即時同步
- AI 解讀上下文（最近 3 筆）：已登入時從 Supabase 讀取，多裝置一致

### 技術規格新增
- Supabase PostgreSQL（`diary_entries` table + RLS）
- Supabase Auth（Magic Link + Email/Password）
- `@supabase/ssr` 0.x（Server Component + Route Handler + Middleware）
- 訪客模式完整保留，localStorage 與 Supabase 雙軌並行

### 修正
- Profile 頁「占卜紀錄」筆數：已登入時改從 Supabase 讀取，修正原本固定讀 localStorage 的問題

---

## [0.3.0] — 2026-05-29　AI 對話強化 + 音效 + 文字排版

### 新增

**AI Prompt 強化**
- `buildContext.ts`：之卦大象傳、動爻在之卦的爻辭補入 AI prompt，AI 對「變後走向」解讀更精準

**AI 對話自動儲存（方案 A+B）**
- `ChatSection` 新增 `onRoundComplete` callback，每輪 AI 回應完成後觸發（取代舊的 `onConversationEnd`）
- 按「儲存此次占卜」時自動帶入截至當下的所有對話（`aiConversation`）
- 儲存後繼續對話，每輪自動追加至日記（`updateDiaryEntry`，使用 `useRef` 避免 stale closure）
- 移除「儲存對話至日記」獨立按鈕，操作合併為一步

**AI 回應段落格式化**
- `src/components/FormattedText.tsx`：`\n\n` 切段落 `<p>`、`\n` 轉 `<br>`，段落間 `mb-3` 間距
- 套用至 `ChatSection` AI 氣泡（含 streaming 逐字顯示）
- 套用至日記詳情頁 `aiFirstResponse` 及完整對話回顧

**起卦頁硬幣敲擊音效**
- Web Audio API 合成，零外部音效檔
- 音色設計：噪音爆破（highpass 3500Hz，撞擊感）+ 正弦波金屬共鳴（2000→1200Hz，叮聲）
- 三枚硬幣錯開 18ms 落地，模擬真實敲擊手感
- 右上角 🔕 / 🔔 靜音按鈕，預設靜音，設定存 `localStorage`（`gua_yu_sound`）

---

## [0.2.0] — 2026-05-29　卦象完整性 + 日記強化 + 月曆模式

### 新增

**Sprint 5-A — 結果頁卦象資訊強化**
- `src/lib/trigram.ts`：八卦象意查詢模組（乾天/坤地/震雷/巽風/坎水/離火/艮山/兌澤）
- `src/components/TrigramBadges.tsx`：上下卦象意標籤元件（本卦、之卦共用）
- 結果頁本卦補上上下卦象意標籤
- 之卦區塊補充：大象傳、動爻在之卦的對應爻辭、上下卦象意標籤

**Sprint 5-B — 儲存反饋 + 日記詳情強化**
- `src/components/Toast.tsx`：底部滑入 Toast 元件（含 `useToast` hook，2 秒自動消失）
- 結果頁「儲存此次占卜」加 Toast 反饋
- 日記詳情頁「儲存心情」加 Toast 反饋
- 日記詳情頁（`/history/[id]`）補完整卦象資訊：卦辭、大象傳、上下卦象意、動爻爻辭、之卦完整說明

**Sprint 5-C — AI 對話儲存基礎建設**
- `DiaryEntry` 新增選填欄位 `aiConversation?`，舊資料向後相容
- `lib/diary.ts` 新增 `updateDiaryEntry()` 通用部分更新函數
- `ChatSection` 匯出 `ChatMessage` 型別供外部使用
- 日記詳情頁顯示可折疊的「完整 AI 對話」區塊（AI 左氣泡 / 用戶右氣泡）
- 注：儲存觸發機制於 0.3.0 改為自動追蹤（`onRoundComplete`）

**Sprint 5-D — 日記月曆模式**
- `src/components/DiaryCalendar.tsx`：純 React 月曆元件（不引入外部 library）
  - 7 欄格（日一二三四五六），首日週日對齊
  - 有記錄的日期顯示卦 unicode，多筆顯示數量
  - 今日淡硃砂紅底色，選中日深墨綠底色
- 歷史頁（`/history`）改版為上月曆、下篩選列表（方案 C）
  - 點有記錄的日期 → 列表篩選當日；再點 → 取消篩選
  - 切換月份 → 選中狀態清除，列表同步更新
  - 分隔線動態顯示「M月 共 N 筆」或「M月D日 共 N 筆」

### 技術變更
- `history/page.tsx` 引入 `useMemo` 計算 `monthEntries` / `listEntries`，避免重複過濾
- `TrigramBadges` 由結果頁內嵌函式抽出為獨立共用元件

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

### [0.5.0] — 進階功能（未開始）
- AI 解讀歷史趨勢分析（「你這個月常問感情問題…」）
- 占卜結果生成圖片分享
- 進階變爻解卦規則（6 爻全動、用九/用六）
- 推播提醒
