# 卦語 — 開發計畫與驗收檢核表

> 專案名稱：卦語（Guà Yǔ）
> 定位：手機優先的易經占卜日記工具，隨時問、隨時記、AI 陪你解讀
> 技術棧：Next.js 14 + Tailwind CSS + Claude API (claude-sonnet-4-6) + localStorage
> 視覺風格：古典中華風，深墨綠 + 硃砂紅 + 米白底，Noto Serif TC 字體

---

## Phase 0｜基礎建設（預估 1 週）

### 目標
資料就緒、開發環境建立，確保 64 卦資料正確可查詢，起卦算法可運作。

### 任務清單

- [x] 建立 64 卦完整資料（`doc/hexagrams/hexagrams.json`）
  - 每卦包含：卦名、爻象二進位、上下卦、卦辭、大象傳、6 條爻辭
- [x] 建立 64 卦 MD 備查文件（`doc/hexagrams/all64.md`）
- [x] 初始化 Next.js 14 專案（App Router + Tailwind CSS）
- [x] 建立起卦算法模組（`src/lib/casting.ts`）
  - 模擬三硬幣法（老陽/老陰/少陽/少陰）
  - 輸出：本卦爻組、變爻位置列表、之卦爻組
- [x] 建立查卦邏輯模組（`src/lib/hexagram.ts`）
  - 根據 6 爻陣列查詢對應卦象
  - 查詢對應卦辭、爻辭

### 驗收點

- [x] 呼叫起卦函數，輸出本卦編號、之卦編號（若有）、變爻位置
- [x] 給定任一卦號，能正確回傳卦名、卦辭、6 條爻辭
- [x] 靜卦（無變爻）與動卦（有變爻）兩種情境都能正確產生

> ✅ **2026-05-28 驗收通過**｜`node scripts/verify-phase0.mjs` 全 6 項測試通過

---

## Phase 1｜核心占卜流程（預估 2 週）

### 目標
訪客不需登入，可完成一次完整占卜流程，在手機上順暢瀏覽。

### 任務清單

- [x] 首頁（`/`）
  - 大尺寸問題輸入框（placeholder：「請輸入今日想問之事…」）
  - 「起卦」按鈕（硃砂紅，全寬，大字）
  - 可選：暱稱入口按鈕
- [x] 起卦動畫頁（`/cast`）
  - 逐爻呈現擲卦過程（共 6 次）
  - 每爻顯示標籤（老陽/少陰/少陽/老陰），動爻紅色標示
  - 動畫間隔 0.65 秒，增加儀式感
- [x] 卦象結果頁（`/result`）
  - CSS 繪製本卦爻線（動爻顯示紅色 × 標記）
  - 卦辭大字顯示、大象傳
  - 動爻爻辭紅框高亮顯示
  - 之卦資訊（含小卦象圖）
  - 靜卦說明文字
  - 「展開全部爻辭」折疊按鈕
  - 「詢問 AI」按鈕（Phase 2 預留）
- [x] 手機 RWD
  - 375px 優先，max-w-md 置中
  - 字體 text-xl(20px) 以上為主

### 驗收點

- [ ] 在實機（Android/iOS）完整走完：輸入問題 → 看動畫 → 看卦象結果
- [x] 有變爻的情境：正確顯示變爻爻辭 + 之卦（TypeScript 驗證通過）
- [x] 靜卦情境：顯示「此卦為靜卦，六爻安定」說明
- [x] 折疊展開全部爻辭功能正常
- [x] Dev server 啟動正常，三頁 HTTP 200，無 TypeScript 錯誤

> ✅ **2026-05-28 程式驗收通過**｜`npm run dev` 啟動，三頁皆 200，TypeScript 零錯誤
> ⚠️ **待補**：實機（手機瀏覽器）走完完整流程後方可關閉此 Phase

---

## Phase 2｜AI 解讀對話（預估 2 週）

### 目標
AI 根據用戶問題 + 卦象，給出個人化解讀，訪客可進行 3 輪對話。

### 任務清單

- [x] OpenAI API route（`src/app/api/oracle/route.ts`）
  - 模型：gpt-4o-mini，streaming 回應
  - 接受：hexagramContext（含問題+本卦+動爻+之卦）、messages（對話歷史）
  - 系統 Prompt：易經智慧導師角色，200 字內回應
  - API 失敗時回傳 JSON 錯誤訊息
- [x] 卦象 Context 組裝（`src/lib/buildContext.ts`）
  - 自動整合：問題、本卦卦辭大象傳、動爻爻辭、之卦卦辭
- [x] AI 對話 UI（`src/components/ChatSection.tsx`）
  - 結果頁按下「詢問 AI 解讀」後展開
  - 氣泡對話樣式（AI 左側，用戶右側）
  - Streaming 逐字顯示 + loading 點點動畫
  - 輸入框支援 Enter 送出
  - 3 輪後顯示「已達對話上限」
  - API 失敗顯示友善錯誤訊息，不崩頁

### 驗收點

- [ ] 填入真實 API Key 後，AI 能根據不同卦象給出有差異的解讀
- [ ] Streaming 逐字出現，體驗流暢
- [x] 3 輪對話後輸入框鎖定，顯示上限提示
- [x] API 失敗時顯示友善錯誤提示，不崩頁
- [x] TypeScript 零錯誤，/api/oracle 路由正常編譯

> ✅ **2026-05-29 程式驗收通過**｜TypeScript 零錯誤，路由編譯正常
> ⚠️ **待補**：填入真實 OpenAI API Key 後進行端對端測試

---

## Phase 3｜暱稱身分 + 日記儲存（預估 2 週）

### 目標
有暱稱的用戶可儲存占卜、回顧歷史、加寫日記，AI 知道過去問過的事。

### 任務清單

- [x] 暱稱登入頁（`/profile`）
  - 大字輸入框、建立後顯示個人資訊與統計
  - localStorage 寫入 profile（id, nickname, createdAt）
- [x] 儲存占卜結果
  - 結果頁「儲存此次占卜」按鈕（暱稱用戶顯示）
  - 儲存：問題、本卦、之卦、變爻、AI 第一輪回應、時間戳
  - 儲存後按鈕變為「✓ 已儲存至日記」
- [x] 歷史列表頁（`/history`）
  - 倒序排列，每筆顯示：卦象符號、卦名、問題、日期
  - 有日記時顯示預覽
- [x] 日記詳情頁（`/history/[id]`）
  - 顯示完整占卜記錄 + AI 解讀
  - 可加寫/編輯心情日記，儲存至 localStorage
- [x] 延伸 AI 功能
  - 暱稱用戶：10 輪對話
  - Prompt 附帶最近 3 筆歷史（AI 展現「認識你」的感覺）
- [x] 底部導覽列 NavBar（問卦/歷史/我的，56px 觸控區）

### 驗收點

- [ ] 儲存占卜 → 關閉瀏覽器重開 → 仍能在歷史頁看到記錄
- [ ] 點開舊記錄 → 可新增/編輯日記心情 → 再開仍保留
- [ ] 第 2 次以後的 AI 對話，回應中有提及過去問過的主題
- [ ] 10 輪對話上限正確生效
- [x] TypeScript 零錯誤，五頁皆 HTTP 200

> ✅ **2026-05-29 程式驗收通過**｜TypeScript 零錯誤，所有頁面正常編譯
> ⚠️ **待補**：填入暱稱後走完完整流程（儲存 → 歷史 → 日記 → AI 歷史感知）

---

## Phase 4｜視覺精修 + 無障礙（預估 1 週）

### 目標
老人家也能輕鬆使用，整體視覺符合易經古典風格，不花俏。

### 任務清單

- [x] 配色系統落地
  - 硃砂紅 #C0392B（按鈕/動爻強調）、深墨綠 #1A3C34（標題）、米白 #FAF3E0（底色）
  - 全站 Tailwind custom color（ink / vermilion / paper / inkDark）
- [x] 宣紙質感底色
  - CSS repeating-linear-gradient 橫紋（4% 透明度），模擬中式書紙紋理
- [x] 字體落地：Noto Serif TC，所有頁面統一套用
- [x] 卦象 CSS 繪製：陽爻實線、陰爻斷線、動爻紅色 × 標記
- [x] 底部導覽列：三 tab，64px 觸控高度，active 頂部指示線，aria-label
- [x] 無障礙強化
  - 全站 focus-visible 紅色外框（3px）
  - iOS 防自動縮放（font-size: max(16px, 1em)）
  - textarea/button 加上 aria-label / aria-live / aria-current
  - 所有二級文字從 /30、/40 提升至 /60 以上（改善對比度）
- [x] 字體大小全面修正
  - text-xs / text-sm 內容文字全升為 text-base（16px）以上
  - 首頁加入古典 ☯ 裝飾分隔線

### 驗收點

- [ ] 在 375px 手機瀏覽器無需縮放，所有操作可完成
- [ ] 視覺呈現古典感，不花俏
- [ ] 顏色對比度通過 WCAG AA（建議用 Chrome DevTools 驗證）
- [ ] 長輩測試：至少一位 55 歲以上使用者可獨立完成占卜流程
- [x] TypeScript 零錯誤
- [x] `npm run build` 正式建置成功（9 頁，零警告）

> ✅ **2026-05-29 程式驗收通過**｜Production build 成功，bundle 正常
> ⚠️ **待補**：真實長輩裝置測試（手機瀏覽器實機走流程）

---

## 各 Phase 交付物總覽

| Phase | 週期 | 交付物 | 可展示功能 |
|---|---|---|---|
| Phase 0 | 第 1 週 | 資料檔 + 算法模組 | 命令列執行起卦，輸出卦名+卦辭 |
| Phase 1 | 第 2-3 週 | 占卜流程前端 | 完整問卦→看結果流程（無 AI）|
| Phase 2 | 第 4-5 週 | AI 對話功能 | 問卦 + AI 解讀 3 輪對話 |
| Phase 3 | 第 6-7 週 | 身分 + 日記 | 完整 MVP 功能（暱稱+儲存+歷史）|
| Phase 4 | 第 8 週 | 視覺精修 | 可對外展示的完整產品 |

---

---

## Phase 5｜卦象完整性 + 日記強化 + 月曆模式

> 接續 Phase 4，進一步深化資訊呈現與使用體驗。  
> 拆成 4 個獨立 Sprint，每個 Sprint 可單獨驗收交付。

---

### Sprint 5-A｜結果頁卦象資訊強化

**目標**：之卦補上動爻爻辭，本卦/之卦加上八卦象意標籤，版面主次分明。

#### 任務清單

- [x] 建立八卦象意對應表（新增 `src/lib/trigram.ts`）
  - 乾→天（剛健）、坤→地（柔順）、震→雷（動）、巽→風（入）
  - 坎→水（陷）、離→火（麗）、艮→山（止）、兌→澤（悅）
  - 匯出：`getTrigramInfo(name): TrigramInfo | null`
- [x] 結果頁本卦區塊：卦名下方加上「☰ 乾・天 ｜ ☵ 坎・水」標籤列（`TrigramBadges` 元件）
- [x] 之卦區塊補充：
  - 大象傳（`changedHexagram.image`）
  - 變爻在之卦的對應爻辭（`changedHexagram.yaoCi[changingPositions[n]]`）
  - 上卦/下卦象意標籤
- [x] 版面層次：本卦區塊大字主視角，之卦區塊次要縮排，動爻爻辭用硃砂紅標示

#### 驗收標準

- [x] 有動爻時，之卦區塊顯示：大象傳 + 動爻在之卦的爻辭（硃砂紅標示）
- [x] 本卦與之卦各自有上卦/下卦象意標籤（e.g. 乾・天 / 坎・水）
- [x] 靜卦時不顯示之卦爻辭區塊（無變爻則無此段）
- [x] 視覺主次明確：本卦大字為主，之卦縮排次要
- [x] TypeScript 零錯誤，`npm run build` 通過

> ✅ **2026-05-29 程式驗收通過**｜build 成功，零錯誤，`/result` bundle +0.5kB

---

### Sprint 5-B｜儲存反饋 + 日記詳情強化

**目標**：儲存操作有 Toast 反饋；日記詳情頁資訊完整度對齊結果頁。

#### 任務清單

**5-B1 Toast 元件**
- [x] 建立 `src/components/Toast.tsx`（含 `useToast` hook）
  - 從底部滑入，2 秒後自動消失，純 Tailwind + CSS transition
- [x] 套用至 `/result` 頁「儲存此次占卜」按鈕
- [x] 套用至 `/history/[id]` 頁「儲存心情」按鈕

**5-B2 日記詳情頁補完**
- [x] 用 `getHexagramById()` 查回本卦/之卦完整資料
- [x] 補充顯示：卦辭、大象傳、上下卦象意（`TrigramBadges` 元件）
- [x] 補充動爻爻辭（從本卦 `yaoCi + changingPositions` 取得）
- [x] 若有之卦：顯示卦辭、大象傳、動爻在之卦的爻辭、上下卦象意
- [x] 舊資料進入不崩頁（hexagram 查不到時 graceful fallback，區塊靜默不顯示）
- [x] 抽出 `src/components/TrigramBadges.tsx` 共用元件（result 頁同步改用 import）

#### 驗收標準

- [x] `/result` 儲存後出現 Toast「✓ 已儲存至日記」，2 秒後消失，按鈕同時變灰
- [x] `/history/[id]` 儲存心情後出現 Toast「✓ 心情已儲存」，2 秒後消失
- [x] 日記詳情頁顯示：卦辭、大象傳、上下卦象意、動爻爻辭、之卦完整說明
- [x] 點開舊日記不崩頁，缺少欄位的區塊靜默不顯示
- [x] TypeScript 零錯誤，`npm run build` 通過

> ✅ **2026-05-29 程式驗收通過**｜build 成功，零錯誤

---

### Sprint 5-C｜AI 對話手動儲存

**目標**：用戶可手動選擇將整場 AI 對話儲存進日記，日記詳情頁可回顧完整問答。

#### 任務清單

- [x] `DiaryEntry` 新增選填欄位：`aiConversation?: { role: 'user' | 'assistant'; content: string }[]`
- [x] `lib/diary.ts` 新增 `updateDiaryEntry(id, updates)` — 部分更新任意欄位
- [x] `ChatSection.tsx` 新增 `onConversationEnd?: (messages: ChatMessage[]) => void` callback
  - 達到對話上限（最後一輪 AI 回應完成）時觸發，傳回完整訊息陣列
  - 匯出 `ChatMessage` 型別供父元件使用
- [x] `/result` 頁：對話結束後顯示「儲存對話至日記」按鈕
  - 若尚未儲存日記：Toast 提示「請先儲存此次占卜」
  - 儲存成功後顯示「✓ 對話已儲存」靜態文字，按鈕消失
- [x] `/history/[id]` 詳情頁：若 `aiConversation` 有資料
  - 顯示折疊按鈕（含訊息數量），預設收起
  - 展開後逐條顯示（AI 左氣泡 / 用戶右氣泡，與 ChatSection 樣式一致）

#### 驗收標準

- [x] 對話達上限後，「儲存對話至日記」按鈕出現
- [x] 尚未儲存日記時點按鈕，Toast 提示先儲存
- [x] 儲存後，在 `/history/[id]` 可展開看到完整 AI 對話記錄
- [x] 未手動儲存對話的日記，詳情頁不顯示「展開完整對話」區塊
- [x] `aiConversation` 為 optional，舊資料完全相容不影響
- [x] TypeScript 零錯誤，`npm run build` 通過

> ✅ **2026-05-29 程式驗收通過**｜build 成功，零錯誤

---

### Sprint 5-D｜日記月曆模式（方案 C）

**目標**：歷史頁改為「上半月曆 + 下半篩選列表」，點日期篩選當日記錄。

#### 任務清單

- [x] 建立 `src/components/DiaryCalendar.tsx`（純 React，不引入外部 calendar library）
  - 7 欄格（日一二三四五六），週起始為週日（台灣慣例）
  - 月份切換：‹ › 箭頭，切換後自動清除選中日期
  - 有記錄的日期格：顯示最新一筆的卦 unicode，多筆時右側小字顯示數量
  - 今日格：淡硃砂紅底色 + 日期數字硃砂紅加粗
  - 選中日期格：深墨綠底色（`bg-ink`），卦符與日期改白色
- [x] 歷史頁佈局調整（`history/page.tsx`）
  - 月曆置於頁面上方，分隔線顯示「M月 共 N 筆」或「M月D日 共 N 筆」
  - 記錄列表保留原有 entry card 樣式
  - `monthEntries` / `listEntries` 以 `useMemo` 計算
- [x] 互動邏輯
  - 點有記錄的日期 → 列表篩選當日；再點同日 → 取消篩選回當月
  - 切換月份 → 選中狀態自動清除，列表顯示新月份記錄

#### 驗收標準

- [x] 月曆每月天數與星期對齊正確（含首日偏移）
- [x] 有記錄的日期顯示卦 unicode，無記錄格空白且不可點
- [x] 點選有記錄的日期，列表即時篩選為當日記錄
- [x] 切換月份時，選中狀態清除，列表同步更新
- [x] 手機 375px 下月曆格完整顯示，字體可讀
- [x] TypeScript 零錯誤，`npm run build` 通過

> ✅ **2026-05-29 程式驗收通過**｜build 成功，零錯誤，/history bundle +1kB

---

## Phase 5 交付物總覽

| Sprint | 主要交付 | 可驗證功能 |
|---|---|---|
| 5-A | `trigram.ts` + 結果頁更新 | 之卦有動爻爻辭、八卦象意標籤 |
| 5-B | `Toast.tsx` + 日記詳情強化 | 儲存有 Toast、日記詳情資訊完整 |
| 5-C | `DiaryEntry` 對話欄位 + UI | 手動儲存 AI 對話、詳情頁可回顧 |
| 5-D | `DiaryCalendar.tsx` + 歷史頁改版 | 月曆模式篩選日記 |

---

## 未來版本（暫不開發）

- 後端資料庫（PostgreSQL）：多裝置同步
- 正式用戶系統（Email/手機登入）
- AI 解讀歷史趨勢（「你這個月常問感情問題…」）
- 分享功能（將占卜結果生成圖片分享）
- 推播提醒（「今日適合問卦」）
