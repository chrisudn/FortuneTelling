# AGENTS.md

> 本檔是給所有 AI coding agent（Claude Code、Cursor、Codex、Windsurf 等凡支援 AGENTS.md 規範者）在此專案內工作時參考的唯一真相來源。
> Claude Code 由 `CLAUDE.md` 以 `@AGENTS.md` 匯入本檔，兩者不重複維護。
> 專案文件與程式註解一律使用**繁體中文**，commit message 亦同——格式規範見下方「[Git Commit 規範](#git-commit-規範)」。

## 專案概覽

- **專案名稱 / 用途**：卦語 Guà Yǔ —— 以三硬幣法模擬易經起卦，結合 AI 解讀，讓使用者隨時能問一卦，並將占卜紀錄儲存為心情日記。
- **Tech Stack**：TypeScript 5 / Next.js 14（App Router）/ React 18 / Tailwind CSS 3。AI 用 OpenAI `gpt-4o-mini`（Streaming）。資料層雙軌：訪客走瀏覽器 `localStorage`，登入用戶走 Supabase（Auth + PostgreSQL + RLS）。單一 Next.js 專案，無 monorepo / workspaces，部署 Vercel。
- **啟動方式**：`npm install` → 複製 `.env.local.example` 為 `.env.local` 並填入金鑰 → `npm run dev`
- **特殊領域規則**：見下方「三條硬約束」與「動到這些地方時要知道的事」。**手機優先版面（`max-w-md`）與訪客／登入雙軌資料流是本專案兩個最容易被無意間破壞的設計**，改動前務必確認沒有偷偷假設桌面版面或假設使用者一定已登入。

### 環境變數

需要 `.env.local`：

| 變數 | 說明 | 必填 |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API 金鑰，`/api/oracle` 用 | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key（走 RLS，非 service role） | ✅ |
| `CRON_SECRET` | 限制 `/api/cron/keepalive` 只接受 Vercel Cron 觸發 | 選填 |

---

## 文件目錄慣例（本專案適用）

- `docs/`：本專案自己的沉澱文件，依性質分子目錄：
  - `docs/design/`：產品與架構設計說明、Sprint 計畫、DB schema（如 `supabase-auth-plan.md`、`supabase-schema.sql`、`development-plan.md`）。
  - `docs/verification/`：實測與 code review 報告（如 `code-review-profile.md`）。
  - `docs/reference/`：易經領域知識備查（卦辭爻辭來源、解卦知識），不含程式會 import 的資料。
  - `docs/adr/`：架構決策記錄，目前尚未建立任何 ADR——需要記錄「為什麼這樣做」的重大決策時才新開，命名 `NNNN-kebab-case-標題.md`。
- `src/data/`：程式會實際 import 的執行期資料（目前只有 `hexagrams/hexagrams.json`，64 卦完整資料）。**MUST NOT** 把這類資料放進 `docs/`——`docs/` 只放文件，不放程式相依的資料檔。
- `reference/specs/`：跨專案共用的前端開發規範（`frontend-js-standard.md`），不放本專案的領域邏輯。
- **根目錄只留入口文件**：`README.md`、`CHANGELOG.md`、`AGENTS.md`、`CLAUDE.md`。新增文件 **MUST NOT** 直接丟在根目錄。

---

## 常用指令

```bash
npm run dev      # 啟動開發伺服器（localhost:3000）
npm run build    # 正式建置
npm run start    # 啟動正式伺服器（需先 build）
npm run lint     # ESLint 檢查
node scripts/verify-phase0.mjs   # 驗證 64 卦資料完整性（Phase 0 驗收腳本）
```

**目前沒有設定自動化測試套件**（無 `npm run test`）。改動 `src/lib/casting.ts`、`src/lib/hexagram.ts` 等核心邏輯後，MUST 手動跑一次完整占卜流程（首頁輸入 → 起卦 → 結果 → AI 對話 → 存日記）確認沒有回歸。

---

## 架構

### 使用者流程

```
/ (問題輸入)
  → /cast?q=... (硬幣動畫 + 起卦)
    → /result (卦象顯示 + AI 解讀 + 儲存)
      → /history (日記列表，支援月曆模式)
        → /history/[id] (單筆詳情 + 心情編輯)
/profile (暱稱設定 / 登入狀態 / 帳號統計)
/login (Email 密碼 / Magic Link 登入)
```

### 資料流：cast → result → 儲存

三個頁面靠**兩層 storage** 而非 URL params 或 React context 傳遞狀態：

1. `/cast` 呼叫 `castHexagram()`（純亂數起卦），將原始 `CastResult` 存進 **`sessionStorage`**（`lib/storage.ts` 的 `saveCastSession()`），再導向 `/result`。
2. `/result` 用 `loadCastSession()` 取回，呼叫 `buildReadingResult()`（`lib/hexagram.ts`）從 `src/data/hexagrams/hexagrams.json` 查出對應 `Hexagram`，再用 `buildHexagramContext()`（`lib/buildContext.ts`）組出送給 AI 的 prompt。
3. `/api/oracle`（POST）以純文字串流回傳 OpenAI 回應，`ChatSection.tsx` 用 `getReader()` 讀取。第一輪回應存進 `aiFirstResponse` state，隨 `saveDiaryEntry()` 一起持久化。

### 資料雙軌：訪客 vs 登入

這是本專案最容易被無意間破壞的部分：

- **訪客**：占卜紀錄與暱稱全部在 **`localStorage`**（`lib/diary.ts`：`DiaryEntry`、`UserProfile`）。不強制登入即可完整使用起卦與 AI 解讀（3 輪對話上限）。
- **登入用戶**（Supabase Auth，`@supabase/ssr`）：紀錄改存 Supabase `diary_entries` 表（RLS 保護），透過 `/api/diary`、`/api/diary/[id]`、`/api/diary/count` 讀寫；`lib/supabase/diary.ts` 的 `rowToEntry()` 負責把 DB row 轉回 `DiaryEntry` 型別。暱稱寫入 `auth.updateUser({ data: { nickname } })`，AI 對話上限提高到 10 輪，且會把最近 3 筆紀錄注入 prompt context。
- `middleware.ts` 每個請求都呼叫 `supabase.auth.getUser()` 刷新 session cookie；改動 `matcher` 時要留意別漏掉需要 session 的路由，也別把靜態資源整段納入。
- 新增任何讀寫日記的功能，**MUST** 同時處理「未登入」與「已登入」兩條路徑，不能只改其中一軌（`f67cebf`、`b129729` 兩次 fix 都是漏掉其中一軌造成的回歸）。

### 關鍵資料型別

- `CastLine` / `CastResult` —— 硬幣起卦原始輸出（`lib/casting.ts`）
- `CastSession` —— `/cast` 存進 sessionStorage、`/result` 讀出的中繼資料
- `Hexagram` / `ReadingResult` —— 從 `src/data/hexagrams/hexagrams.json` 查出（64 卦靜態資料集）
- `DiaryEntry` —— 占卜日記紀錄（localStorage 或 Supabase 皆用同一介面，見 `lib/diary.ts`）
- `UserProfile` —— 訪客暱稱（僅 localStorage；登入用戶的暱稱在 Supabase `user_metadata`）

### 樣式

自訂 Tailwind 主題（`tailwind.config.ts`）：
- `bg-paper` / `text-ink` / `text-inkDark` / `bg-vermilion` —— 宣紙美學核心色票
- `font-serif` 對應 Noto Serif TC
- `animate-fadeIn` —— 唯一的自訂動畫
- 版面固定 `max-w-md`，所有 UI 皆以手機畫面設計；互動元素觸控高度以 56px 為底線（長輩友善）

### API route

`/api/oracle` 以 `text/plain; charset=utf-8` 串流 OpenAI `gpt-4o-mini` 回應，Client 端在 `ChatSection.tsx` 用 `getReader()` 讀取。每個 session 預設對話輪數上限由 `maxRounds` prop 控制（訪客 3、暱稱／登入用戶 10）。`/api/cron/keepalive` 由 Vercel Cron 每日呼叫一次，避免 Supabase 免費方案專案因 7 天無 API 流量被自動暫停。

---

## 三條硬約束

1. **`max-w-md` 手機優先版面不得放寬。** 全站假設在手機瀏覽器使用，新增頁面或元件 **MUST NOT** 假設有桌面寬版空間可用。
2. **cast → result 的資料流只能走 `sessionStorage`，不得改成 URL query 或 React context。** 起卦結果含完整六爻與變爻資訊，塞進 URL 會過長且刷新頁面會遺失狀態；改用 context 則 `/result` 直接重新整理會拿不到資料（sessionStorage 在同分頁重新整理仍存在，這是選它的原因）。
3. **AI prompt context（`buildContext.ts`）不得外洩其他使用者的資料。** 注入歷史紀錄只能取「目前這位使用者」自己的 `recentEntries`，不論訪客（localStorage 本來就是隔離的）或登入用戶（Supabase RLS 隔離）都一樣，新增任何 prompt 組裝邏輯前先確認資料來源已經是「使用者自己的」。

---

## 動到這些地方時要知道的事

**改 `src/data/hexagrams/hexagrams.json` 要同步改 `docs/reference/hexagrams-all64.md`。** 後者是前者的人工備查文件，兩邊資料應一致；改完可跑 `node scripts/verify-phase0.mjs` 驗證資料完整性。

**Windows 本機建置對 `next/og`（`ImageResponse`）有已知雷。** 曾規劃用它動態產生 favicon / OG 分享圖，但在 Windows 本機 `next build` 會踩到 `@vercel/og` 的路徑解析 bug（官方 issue #77164），導致建置失敗。目前用靜態 `icon.svg`，**尚未有 OG 分享圖**。若要重新嘗試動態圖片產生，MUST 先在 Linux／CI 環境驗證過建置會過，不要只在 Windows 本機測試就視為可行。

**新增 Supabase 資料表或欄位時，記得同步更新 `docs/design/supabase-schema.sql`**，並確認新增的欄位／表有對應 RLS policy——本專案沒有 service role key，所有 Supabase 存取都走 anon key + RLS。

**`robots.ts` / `sitemap.ts` 排除的路由要跟著實際登入牆同步。** 目前排除 `/cast`、`/result`、`/history`、`/profile`、`/api/`、`/auth/`（依賴 session 或起卦狀態），只收錄 `/` 與 `/login`。新增公開頁面時記得檢查是否該補進 sitemap。

---

## Git Commit 規範

採 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/)，**subject 使用繁體中文**。

### 格式

```
<type>(<scope>): <subject>
```

### type（只能用這些）

| type | 用途 | type | 用途 |
|---|---|---|---|
| `feat` | 新功能 | `test` | 測試相關 |
| `fix` | 修 bug | `build` | 建置系統或相依調整 |
| `docs` | 文件變更 | `ci` | CI/CD 設定 |
| `style` | 格式調整，不影響邏輯 | `chore` | 雜項維護 |
| `refactor` | 重構，不新增功能也不修 bug | `revert` | 還原變更 |
| `perf` | 效能改善 | | |

### scope

依受影響的路由或功能模組命名，判斷不出來就省略。既有慣例：`auth`、`profile`、`history`、`cast`、`api`、`seo`、`docs`。本專案規模小，不強制維護固定清單，但同一類改動請沿用既有 scope 名稱，不要每次自創同義詞（例如都叫 `profile` 不要有時又叫 `user`）。

### subject

- **MUST** 用繁體中文，祈使句或明確描述變更結果。
- **MUST NOT** 超過 50 個中文字、**MUST NOT** 以句號結尾。
- **MUST NOT** 籠統帶過。「更新程式碼」「修正問題」這類寫法一律重寫。

| ✅ | ❌ |
|---|---|
| `fix(profile): 修正占卜筆數顯示的五項問題` | `fix: 修正問題` |
| `feat(auth): 整合 Supabase Auth 並新增多裝置同步功能` | `feat: 新增功能` |

### body 與 footer

- body 說明**變更原因與影響**，非必要可省略。
- AI agent 產生的 commit **MUST** 把署名（如 `Co-Authored-By:`）放在 footer 最後一行。

---

## Code Review Checklist（提交前自我檢查）

**本專案硬約束**
- [ ] 有沒有假設桌面寬版面（跳出 `max-w-md`）？
- [ ] cast → result 的資料傳遞是不是還是走 `sessionStorage`，沒有偷改成 URL params 或 context？
- [ ] 新增的日記讀寫功能，訪客（localStorage）與登入（Supabase）兩條路徑是不是都處理了？
- [ ] AI prompt context 有沒有可能夾帶到別的使用者資料？

**一般檢查**
- [ ] 外部資料（Supabase row、`localStorage`、URL params）是直接 `as` 硬轉還是有基本檢查？
- [ ] 有沒有把 `OPENAI_API_KEY` 或任何 Supabase key 意外傳到 client？
- [ ] 互動元素是原生 `<button>`／`<a>` 嗎？表單有 label 嗎？觸控高度符合 56px 底線嗎？
- [ ] commit message 符合「[Git Commit 規範](#git-commit-規範)」嗎？

---

## 文件導覽

| 問題 | 文件 |
|---|---|
| 前端怎麼寫（跨專案通用規範） | [`reference/specs/frontend-js-standard.md`](reference/specs/frontend-js-standard.md) |
| 產品功能、開發計畫、驗收檢核表 | [`docs/design/development-plan.md`](docs/design/development-plan.md) |
| Supabase Auth 架構與 Sprint 計畫 | [`docs/design/supabase-auth-plan.md`](docs/design/supabase-auth-plan.md) |
| Supabase DB schema | [`docs/design/supabase-schema.sql`](docs/design/supabase-schema.sql) |
| 近期 code review 發現與修法 | [`docs/verification/code-review-profile.md`](docs/verification/code-review-profile.md) |
| 易經 / 卦辭爻辭領域知識 | [`docs/reference/fortuneTellingKnowHow.md`](docs/reference/fortuneTellingKnowHow.md)、[`docs/reference/hexagrams-all64.md`](docs/reference/hexagrams-all64.md) |
| 版本歷史、每版做了什麼取捨 | [`CHANGELOG.md`](CHANGELOG.md) |
| 功能總覽、視覺設計規範、專案結構 | [`README.md`](README.md) |

---

## 目前進度

版本 **v0.4.2**。Phase 0–4（64 卦資料、核心占卜流程、AI 解讀對話、暱稱身分與日記、視覺精修）已完成，詳見 README「開發進度」表。近期重點在 Supabase Auth 多裝置同步（v0.4.0）與 SEO 基礎建設（v0.4.1–0.4.2），逐版異動見 `CHANGELOG.md`。

本專案已預先建立 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 目錄結構（`openspec/`）與相關 skill，但**目前尚未實際採用**（`openspec/changes`、`openspec/specs` 皆為空）。若之後要導入 spec-driven 的變更留痕流程，先確認團隊要採用再開始寫 proposal，不要假設既有 change 存在。
