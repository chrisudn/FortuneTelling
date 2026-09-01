# AGENTS.md

> 本檔是給所有 AI coding agent（Claude Code、Cursor、Codex、Windsurf 等凡支援 AGENTS.md 規範者）在此專案內工作時參考的唯一真相來源。
> Claude Code 由 `CLAUDE.md` 以 `@AGENTS.md` 匯入本檔，兩者不重複維護。
> 專案文件與程式註解一律使用**繁體中文**，commit message 亦同——格式規範見下方「[Git Commit 規範](#git-commit-規範)」。

## 專案概覽

- **專案名稱 / 用途**：ZiweiDoushu —— 手機優先的紫微斗數排盤與白話解讀。目標對象是**完全不懂命理的一般大眾**，不呈現傳統十二宮方盤、不堆砌術語。
- **Tech Stack**：TypeScript 5 / Next.js 16（App Router）/ React 19 / Tailwind CSS 4 / Vitest 2 / iztro 2.6.0（排盤引擎）/ OpenAI `gpt-5-mini`（僅離線預生成階段）。npm workspaces（`core` + `web`），部署 Vercel。
- **啟動方式**：`npm install` → `npm run dev`
- **特殊領域規則**：見下方「三條硬約束」與「動到這些地方時要知道的事」。**排盤規則的取捨會寫死進命盤結果**，不是可以隨手改的設定值。

## 文件目錄慣例（本專案適用，非通用範本內容）

> 決策依據見 [`docs/adr/0001-docs-directory-organization.md`](docs/adr/0001-docs-directory-organization.md)。

- `reference/specs/`：**跨專案共用**的開發規範（唯一真相來源，見下方「開發前必讀」）。不放本專案的領域邏輯。
- `docs/`：本專案自己的沉澱文件，依性質分子目錄：
  - `docs/adr/`：架構決策記錄。命名 `NNNN-kebab-case-標題.md`，一旦 Accepted 不修改內容，要變更就開新編號並標記 supersede 舊的。
  - `docs/design/`：產品與架構設計說明。
  - `docs/verification/`：實測報告與數據出處。
- **根目錄只留入口文件**：`README.md`、`CHANGELOG.md`、`AGENTS.md`、`CLAUDE.md`。新增文件 **MUST NOT** 直接丟在根目錄。

### `docs/adr/DECISIONS.md` 是特例

它是**單一決策日誌**（內部以 `A`–`F` / `O` 分節編號），不是編號 ADR。這是刻意的——本專案的決策高度互相耦合，且編號已被約 40 處引用（含程式碼註解與 `openspec/` 全部 artifact）。理由見 ADR 0001 第 4 點。

引用決策 **MUST** 用編號（`docs/adr/DECISIONS.md` E2）而非重述理由。狀態分三級：**已拍板**（負責人明確決定）、**建議**（分析產出但未拍板）、**未決**（需外部資訊）。**MUST NOT** 把「建議」當「已拍板」引用。

---

## ⚠️ 開發前必讀：前端開發規範

**在撰寫或審查任何 TypeScript / React 程式碼之前，必須先讀過 `reference/specs/` 下的文件：**

| 檔案 | 內容 |
|---|---|
| [`frontend-js-standard.md`](reference/specs/frontend-js-standard.md) | 分層與依賴方向、目錄結構、命名、元件分類、狀態管理分層、邊界驗證、TypeScript、副作用、樣式、a11y、環境變數、測試 |

這份是跨專案共用規範。以下為濃縮版 MUST 規則供快速檢查，**細節與例外以原文為準**。

### 分層與依賴方向
- 方向：`core → shared → features → app`。反向 import 一律禁止。
- `features/A` **MUST NOT** import `features/B`；shared 層 **MUST NOT** import `features/` 或 `app/`。
- `app/`（路由層）**MUST NOT** 寫商業規則；`components/` 內的元件 **MUST NOT** 自行取資料。
- `core/` **MUST NOT** import 任何 UI 框架或瀏覽器 API——本專案已由 `core/scripts/check-deps.mjs` 強制。

### 命名
- 元件 `PascalCase.tsx`、hook/composable `useXxx.ts`、純函數模組 `kebab-case.ts`、目錄 `kebab-case`。
- **MUST NOT** 出現 `utils.ts` / `helpers.ts` / `common.ts` 這類桶底檔，也 **MUST NOT** 用 `data`、`info`、`obj`、`temp` 當變數名。
- 緊耦合子元件以父元件名為前綴（`ChartCard` / `ChartCardHeader`）。
- 布林用 `is` / `has` / `can` / `should` 開頭，禁止否定命名。React 事件 prop 用 `onXxx`、實作用 `handleXxx`。
- 資料模型四層分開命名：`XxxDto`（外部回應）/ `XxxRequest`（送出）/ 裸名詞（領域模型）/ `XxxVm`（畫面模型）。**MUST NOT** 把畫面模型叫 `VO`。

### 元件分類（React / Next.js App Router）
- **預設 Server Component**，只有真正需要互動才加 `"use client"`，且 **MUST** 放在葉節點附近，不要放在 layout 或 page 頂端。
- 三分類不可混：`components/`（純呈現、不取資料）、`features/*/components/`（組合資料與呈現）、`app/`（路由、佈局、錯誤邊界）。
- Server Action **MUST** 視為公開 HTTP 端點，一律重新驗證輸入。

### 狀態管理分層
判斷順序 **MUST** 是：能不能算出來 → 能不能放 URL → 能不能放最近共同父層 → 最後才考慮全域。**MUST NOT** 把 server state 複製進全域 store 手動同步。

### 邊界驗證
- 外部 API 回應、URL params、`localStorage`、表單輸入 **MUST** 用 schema parse，**MUST NOT** 用 `as XxxDto` 硬轉。
- schema 是型別的唯一來源（`z.infer`），不手寫第二份 interface。
- **MUST NOT** 出現 `any`、`as unknown as T`、`@ts-ignore`。
- 互斥狀態 **MUST** 用 discriminated union，不用一堆 optional flag。

### 副作用
`useEffect` 是逃生門不是資料流工具。可以在 render 期間算出來的、該寫在 event handler 的、該用 server 取的，**MUST NOT** 用 effect。

### 可及性
互動元素 **MUST** 用原生 `<button>` / `<a>`，**MUST NOT** 用 `<div onClick>`。表單每個輸入 **MUST** 有 label。

> ⚠️ **新增 feature 時 MUST 在 `web/eslint.config.mjs` 的 zones 補一條**，否則該 feature 的跨界 import 不會被擋到（這個規則的形狀就是每個 feature 各列一條）。目前已列 `birth-input`、`chart-display`、`interpretation`。

### 排盤只能在伺服器端算

iztro 打包後約 768KB（未壓縮）且相依 `lunar-typescript`／`dayjs`／`i18next`，**MUST NOT** 進 client bundle。

- `import { chartEngine } from '@ziwei/core'` 只能出現在 Server Action 或 Route Handler。敘述層（narrator）同理，且它還會帶進含義表——`web/features/interpretation/` 因此分成 `index.ts`（client 端安全）與 `server.ts` 兩個入口。
- 前端要用的純邏輯改走 subpath：`@ziwei/core/hour-guidance`、`@ziwei/core/calendar`、`@ziwei/core/config`；型別用 `import type ... from '@ziwei/core/types'`（完全被抹除，安全）。
- 這條已前移為原始碼層守門：`web/copy-guard.test.ts` 斷言帶 `'use client'` 的檔案只能以 `import type` 引用 core 的 root barrel。
- 建置後的驗證仍要做：`npx next build && grep -rl "iztro\|lunar-typescript" .next/static` 應無輸出；十四主星星名只應命中「紫微」（來自「紫微斗數」這個產品名稱）。

---

## 常用指令

根目錄為 npm workspaces（`core` + `web`）。`tests/golden/` **不在** workspace 內，有獨立 `package.json`，第一次使用需自行 `npm install`。

```bash
npm install            # 安裝 core + web 全部相依
npm run dev            # 啟動 web 開發伺服器（next dev）
npm run build          # next build
npm run test           # core 171 個 + web 288 個測試（core 約 40 秒，iztro 排盤本身慢）
npm run check          # check:core + check:web —— 提交前跑這個
npm run check:core     # core：typecheck + check-deps + check-dates + test
npm run check:web      # web：typecheck + eslint + test
```

core 內（`cd core`）：

```bash
npm run test:watch                        # vitest watch
npx vitest run test/golden.test.ts        # 單一測試檔
npx vitest run -t '純函數'                 # 單一測試名稱
npm run typecheck                         # tsc --noEmit（strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes）
npm run lint:deps                         # 擋前端框架被裝進 core
npm run lint:dates                        # 擋 core/src 出現 Date API
npm run measure                           # 跑 measurements/ 的一次性量測（最長那支 42 分鐘）
npm run pregen:keys                       # 枚舉待生成的解讀鍵清單（約 15 分鐘，跑一次）
npm run pregen -- --coverage              # 內容庫覆蓋率
npm run pregen -- --section=<id> --dry-run # 印出實際會送出的 prompt，不呼叫 API
npm run pregen -- --review=<id>           # 抽審清單，把握度低者排前面
```

`core/measurements/` 是**一次性量測程式，不是回歸測試**——刻意由 `vitest.measure.config.ts` 另外收，不進 `npm run test`。每支檔頭記著它量過什麼、結果是多少、跑多久；產品行為一律以 `core/src` 為準，量測檔裡的重複實作只為比較用。

web 內（`cd web`）：

```bash
npm run lint                              # eslint（含分層邊界檢查）
npm run typecheck
npm run test                              # vitest（node 環境，不需 jsdom）
npx vitest run lib/analytics              # 只跑埋點
```

其他：

```bash
cd tests/golden && npm install && npm run verify   # 24 案例排盤回歸，不符即 exit 1
node content/star-meanings.mjs                     # 列出待人工審查的星曜含義（依把握度排序）
openspec list                                      # 查看 change 進度

cd web && npm run analytics:funnel -- events.log   # 從埋點日誌算漏斗完成率
vercel logs <url> | node web/scripts/funnel.mjs    # 或直接餵管線
```

---

## 架構

資料流是單向的，每一層的存在都由 Phase 0 實測結果決定（出處見 `docs/verification/PHASE0-VERIFICATION.md`）：

```
純整數輸入 {year, month, day, hourBranchIndex, gender}
   ↓  core/src/iztro-adapter.ts   ← 唯一允許 import iztro 的檔案
FullChart | HourRequired          ← 可辨別聯集，不是「有欄位缺失的命盤」
   ↓  core/src/narrator/           ← 敘述層，純函數。原型為 prototypes/narrator-v2.mjs
受控中文事實句（含義來自 content/star-meanings.mjs）
   ↓  core/pregen/                  ← 離線預生成（gpt-5-mini）。執行期不呼叫 LLM
content/interpretations/*.json      ← 預生成的解讀，進版控
   ↓  web/features/interpretation/  ← 查表；查不到就以事實句誠實降級
白話解讀
```

- **`core/`** — 純 TypeScript 排盤核心，`main` 直指 `src/index.ts`（未編譯），由 `web/next.config.ts` 以 `transpilePackages: ['@ziwei/core']` 轉譯。改 `core/` 立即反映到 `web/`，無建置步驟。`check-deps.mjs` 的 ALLOW_DEPS 只有 `iztro`。
- **`core/src/config.ts`** — 排盤四軸（`fixLeap` / `dayDivide` / `yearDivide` / `algorithm`）的**唯一來源**，並推導出 `ENGINE_VERSION`。這些值 **MUST NOT** 出現在此檔以外任何位置。
- **`core/src/types.ts`** — `Chart` 以十二宮名為主索引（非地支），因為下游關心「命宮有什麼星」而非「亥宮有什麼星」。
- **`core/pregen/`** — 離線預生成管線（見該目錄 `README.md`）。刻意**不在** `core/src` 內：這裡有網路呼叫與檔案讀寫，而 `core/src` 是純邏輯；web 層也因此拿不到它。以 `vite-node` 執行，零新增套件（LLM 呼叫用 Node 內建 `fetch`）。⚠️ **越界偵測是輔助不是把關**——Phase 0 實測時它漏抓過「把五行局當性格解讀」。
- **`core/src/narrator/`** — 敘述層。**刻意不開放 `@ziwei/core/narrator` subpath**：它會 import `content/star-meanings.mjs`（含十四主星星名與一段用到 `node:url` 的 CLI 進入點），開 subpath 等於邀請 client component 直接 import，而 eslint 的 zones 擋不到跨 workspace 的 import。與 iztro 同一條理由，只從伺服器端入口 `@ziwei/core` 匯出。事實句放什麼／不放什麼的判準見該目錄 `facts.ts` 檔頭。
- **`content/star-meanings.mjs`** — 52 條原子含義，**這是產品的實際解讀內容**，LLM 只是改寫器。每條帶 `confidence: high|mid|low` 供日後命理審核排序。刻意不提供含義的項目（地支、宮干、38 種雜曜）就不會出現在解讀中。
- **`web/`** — 分層與禁止事項見 `web/README.md`。`web/AGENTS.md` 是 `next dev` 自動寫入並維護的 Next.js 16 提醒區塊，改動會被覆寫。
- **`prototypes/`** — Phase 0 一次性實驗程式，**非產品程式碼**。`prototypes/meanings.mjs` 已被 `content/star-meanings.mjs` 取代，不要引用。

---

## 三條硬約束（本專案特有，違反會造成實際傷害）

1. **排盤資料流全程純整數。** 從輸入元件到 `ChartEngine` 只傳 `{ year, month, day, hourBranchIndex }`，一次都不經過 `Date` 物件或 ISO 字串——瀏覽器用裝置時區、伺服器用 UTC，日期會整個位移一天。`core/src` 由 `check-dates.mjs` 靜態擋住；web 層目前靠 code review。
2. **出生資訊不落地。** 不寫 DB（MVP 全程不需要 DB）、不寫日誌、不進埋點事件、不進錯誤追蹤。**新增任何 logging 或錯誤上報時必須重新檢查這一條**，預設行為通常會記下 body 與 query string。

   `web/next.config.ts` 目前關掉兩項框架預設，兩項都 **MUST NOT** 打開：

   | 設定 | 不關會怎樣 |
   |---|---|
   | `logging.fetches.fullUrl` | query string 進日誌 |
   | `logging.serverFunctions` | **Server Function 的參數整包進日誌**——`ƒ computeChart({"day":20,"gender":"M",...})` |

   後者是任務 8.1 實測才發現的。⚠️ **這一類缺陷單元測試抓不到**：`compute-chart.test.ts` 斷言 Server Action 內 `console` 未被呼叫，而且確實通過——日誌是 Next dev server 印的，不是我們的程式碼。因此改為由 `web/copy-guard.test.ts` 直接守設定檔。
3. **時辰未知時不得偽造命盤。** `hourBranchIndex: 'unknown'` 回傳 `HourRequired`，不含任何宮位星曜資料。不得代入預設時辰，不得以生肖／星座包裝成命盤呈現。實測：同一出生日的 13 個時辰產生 12 種不同命盤，命宮位置、五行局、十二宮主星配置全部依賴時辰，因此不存在有意義的「部分命盤」。唯一救援路徑是 `core/src/hour-guidance.ts` 的引導（最多三題收斂，純函數）。

---

## 動到這些地方時要知道的事

**改排盤四軸 = 所有已預生成解讀內容失效需重跑。** 四軸計入 `ENGINE_VERSION`，快取會自動失效，但內容生成成本是真的。`core/test/golden.test.ts` 與 `tests/golden/verify.mjs` 都會在比對命盤**之前**先檢查設定漂移，故意讓錯誤訊息指向「規則被改了」而不是「排盤壞了」。

**`tests/golden/verify.mjs` 失敗時不要用 `npm run generate` 修好它。** 只有三種情況該重跑 generate：刻意變更四軸、升級 iztro 且確認新行為是預期的、擴充案例。其他任何時候失敗都是回歸錯誤。

**正確性的立論基礎是交叉比對，不是專家背書。** 本專案沒有命理顧問（`docs/adr/DECISIONS.md` O1），信心來自與獨立實作 `fortel-ziweidoushu` 的逐宮比對 24/24。可以說「兩套獨立實作在 24 個案例上一致，規則已公開」；**不能**說「我們算得準」。全站文案不得出現「精準」「專業命理」「權威」——這條由 `web/copy-guard.test.ts` 自動掃描擋住。

**「無法排盤」頁面不得碰 `hourIndependent`。** 農曆日期、生肖、星座、四柱在 `HourRequired` 上都拿得到，但呈現出來就是拿萬年曆當命盤。這條有雙層測試（原始碼引用檢查 + 渲染輸出檢查），連 `blur`／`skeleton` 這種「毛玻璃遮住的命盤」也擋——那會讓人以為命盤已算出、只是被鎖住。

**含義漏失是靜默的。** 敘述層對查無含義的星曜靜默略過（這是刻意設計，用來排除雜曜），所以漏一顆主星的症狀也是靜默消失。`core/test/meanings-coverage.test.ts` 就是把這種漏失變成明確失敗。

**時辰引導刻意不用「天亮了沒」當判準。** 日出時間隨季節與緯度差異可達兩小時，會導向錯誤時辰。改以作息事件（睡覺、三餐）為錨點。

---

## 變更管理流程：OpenSpec

- 本專案採用 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 做變更留痕。非小改動（新功能、行為變更、跨層調整）**必須先產生 proposal 再實作**，不要跳過直接改 code。
- 標準流程：
  1. **Propose**：`openspec-propose` 產生 `openspec/changes/<change-name>/{proposal,design,tasks}.md`。
  2. **Apply**：`openspec-apply-change` 逐項完成 `tasks.md`，並**確實勾選 checkbox**。
  3. **Archive**：完成並上線後 `openspec-archive-change` 移到 `openspec/changes/archive/`，同步更新 `openspec/specs/`。
- 小修（bug fix、文案、設定值調整）可不走 OpenSpec，直接改。
- `openspec/config.yaml` 內有「已定案，不可推翻」清單與 artifact 撰寫要求（繁體中文、不得虛構未驗證數據、引用數字須標明出處），撰寫 artifact 前 **MUST** 查閱。
- 若被問及某個 change 的進度，**一律以程式碼與 git log 為準**，不要只看 `tasks.md` 勾選狀態。

### 與版本發布的順序關係（MUST）

Archive 與進版（`CHANGELOG.md`）都是「記錄異動已確認沒問題」的收尾動作，**必須排在部署驗證之後**：

1. **Git**：commit/push 實作完成的程式碼（`tasks.md` 全勾、`npm run check:core` 全過）。
2. **部署驗證**：部署到 Vercel，這一步本身就是上線，不是流程最後一步。
3. **確認沒問題**：實機（手機瀏覽器）跑一次真實流程。
4. **Archive**：確認沒問題後才歸檔，這樣 CHANGELOG 引用歸檔路徑時路徑已是最終的。
5. **進版**：補 `CHANGELOG.md` 條目，比照既有格式。
6. **上 Git**：commit「archive + CHANGELOG」這組收尾異動並 push。

**理由**：CHANGELOG 應該是「已驗證屬實」的歷史紀錄，不是「預計要發生」的計畫。

### 進版時機與版號規則（MUST）

上一節定的是**順序**，這一節定的是**什麼算一版**。

**觸發點只有一個：一個 OpenSpec change 完成並通過部署驗證後歸檔。** 不是每次 commit、不是每次 push、不是每次部署。

| 位數 | 觸發條件 |
|---|---|
| MINOR `0.X.0` | 一個 Phase／OpenSpec change 完成並通過部署驗證。Phase 2 完成 → `0.3.0` |
| PATCH `0.2.X` | **已上線後**才發現的修正：硬約束違規、使用者走得到的 bug。不含任何新功能 |
| MAJOR `1.0.0` | 保留給「移除存取保護、對外公開」那一刻 |

- **小修單獨不進版。** 文案、設定值、尚未上線的 bug 直接 commit，內容累積到下次歸檔時一併寫進該版的 CHANGELOG 條目。**例外**：已上線後的硬約束違規修正 **MUST** 立刻進 PATCH——對外需要一個「何時之後不再違規」的版本號可指。
- **排盤四軸變動 MUST 進 MINOR 以上**，即使 diff 只有一個字元。它改變 `ENGINE_VERSION`、使全部預生成解讀失效，屬破壞性變更（0.x 階段進 MINOR，1.0 之後進 MAJOR），且 **MUST** 在 commit footer 加 `BREAKING CHANGE:`。
- **`1.0.0` 綁定 `docs/adr/DECISIONS.md` B5 觸發條件二不是巧合。** 移除存取保護＝對外公開＝Hobby 用量監控必須重新處理。版號與這件事綁在一起，是讓「要進 1.0 了」自動成為「B5 該重看了」的提醒。
- **進版只動 root `package.json` 與 `CHANGELOG.md`。** `core/package.json` 與 `web/package.json` 的 `version` 欄位一律不動——三個套件都是 `private: true`、不發佈、無獨立消費者，CHANGELOG 引用的一律是 root 版本。目前 workspace 停在 `0.1.0` 是刻意的，不是漏改。

---

## Git Commit 規範

採 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/)，**subject 使用繁體中文**。根目錄的 [`.gitmessage`](.gitmessage) 是同一份規範的填空版模板，本機啟用：

```bash
git config commit.template .gitmessage
```

### Commit 時機

**單位：一個 OpenSpec 任務群 = 一個 commit。** 不細到單一 checkbox（任務 6.1 自己不能運作），也不粗到整個 Phase（review 不動）。既有節奏見 `feat(web): 出生資訊輸入與排盤流程`（任務 6.1–6.7）、`feat(web): 埋點與匿名識別`（任務 5.1–5.5）。

該 commit 的四個時機：

1. **任務群完成且 `npm run check` 全過。** 兩個條件缺一不 commit——check 不過的狀態進了 main，`git bisect` 就失去意義。
2. **硬約束相關的修正 MUST 自成一個 commit**，不夾進當時正在做的 feature（範例：`fix(web): 生辰不再寫入 dev 日誌`）。理由是這類 commit 事後要能被單獨指認與稽核——「生辰什麼時候不再落地的」必須有一個明確的 SHA 可指。
3. **機械性大改動 MUST 自成一個 commit**：`git mv`、全庫路徑替換、格式化。0.2.0 搬動約 70 處引用，混進邏輯改動後 diff 就讀不出哪幾行真的改了行為。
4. **純文件沉澱自成一個 commit**（`docs:` / `chore(docs):`）。但程式碼改動連帶的 spec、註解、`tasks.md` 勾選 **MUST NOT** 拆開——拆了會出現「程式已改、spec 說舊行為」的中間狀態。

**判準**：一個 commit 的 diff，能在十分鐘內講完「改了什麼、為什麼」。講不完就該拆。

**MUST NOT 累積到一天結束才一次 commit。** 本專案直接在 main 上開發且 push 會觸發 Vercel 部署，過大的 commit 等於把部署驗證的粒度一起變粗，出事時無法定位是哪一段造成的。

### 格式

```
<type>(<scope>): <subject>
                            ← 空一行
<body：說明「為什麼改」與「影響到什麼」，非必要可省略>
                            ← 空一行
<footer：BREAKING CHANGE / Co-Authored-By>
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

### scope（受影響的模組，判斷不出來就省略）

本專案目前只有三個：`core`（排盤核心 `core/`）、`web`（前端應用 `web/`）、`docs`（文件）。**MUST NOT** 自創 scope；真的需要新的就先在此表補上。

### subject

- **MUST** 用繁體中文，祈使句或明確描述變更結果。
- **MUST NOT** 超過 50 個中文字、**MUST NOT** 以句號結尾。
- **MUST NOT** 籠統帶過。「更新程式碼」「修正問題」「調整一下」這類寫法一律重寫。

| ✅ | ❌ |
|---|---|
| `fix(web): 生辰不再寫入 dev 日誌` | `fix(web): 修正問題` |
| `refactor(docs): 統一引用架構與實測文件的路徑` | `docs: 更新文件` |
| `feat(core): 排盤核心與時辰引導` | `feat: 新增功能` |

### body 與 footer

- body 說明**變更原因與影響**，不是重述 diff。牽涉決策時 **MUST** 引用編號（例：`依 docs/adr/DECISIONS.md B5`）而非重述理由。
- 破壞性調整 **MUST** 在 footer 加 `BREAKING CHANGE: <說明>`。**排盤四軸的任何變動都算**——它會讓全部預生成解讀內容失效（見「動到這些地方時要知道的事」）。
- AI agent 產生的 commit **MUST** 把署名（如 `Co-Authored-By:`）放在 footer 最後一行。

### 硬約束延伸

commit message 是會永久留存的公開文字，因此同樣受兩條硬約束管轄：

- **MUST NOT** 出現任何真實出生資訊或可反推的衍生值（含年份、生肖、星座）——測試案例請以 golden case 編號指稱。
- **MUST NOT** 出現「精準」「專業命理」「權威」。

---

## Code Review Checklist（提交前自我檢查）

**本專案硬約束**
- [ ] 排盤資料流有沒有出現 `Date` 物件或 ISO 字串？
- [ ] 新增的 logging／錯誤上報／埋點事件會不會帶到出生資訊或可反推的衍生值（含年份、星座）？
- [ ] `unknown` 時辰的路徑有沒有偷偷代入預設值，或以生肖星座充數？
- [ ] 有沒有動到排盤四軸？若有，是否理解全部預生成內容需重跑？
- [ ] 新增文案有沒有出現「精準」「專業命理」「權威」？
- [ ] commit message 符合「[Git Commit 規範](#git-commit-規範)」嗎？subject 夠具體、沒帶到出生資訊嗎？

**前端規範**（細節見 [`reference/specs/frontend-js-standard.md`](reference/specs/frontend-js-standard.md) §16）
- [ ] 有沒有 feature 互相 import？shared 層有沒有反向依賴？
- [ ] `"use client"` 是不是放在葉節點附近，而不是整棵子樹？
- [ ] 外部資料（API／URL／localStorage）是 parse 進來還是 `as` 硬轉？
- [ ] 新增的狀態走過「derive → URL → 就近父層 → 全域」的判斷了嗎？
- [ ] 新增的 `useEffect` 是真的需要，還是可以改寫成衍生值或 event handler？
- [ ] 有沒有新增 `any` / `@ts-ignore`？有沒有留 `console.log`？
- [ ] 互動元素是原生 `<button>`／`<a>` 嗎？表單有 label 嗎？

---

## 文件導覽

每份文件回答一個特定問題，內容不重複。做決定前先查，不要重新推論。

| 問題 | 文件 |
|---|---|
| 前端怎麼寫（跨專案通用） | [`reference/specs/frontend-js-standard.md`](reference/specs/frontend-js-standard.md) |
| 為什麼這樣做？依據是什麼？ | [`docs/adr/DECISIONS.md`](docs/adr/DECISIONS.md) —— **唯一的決策來源** |
| 文件為什麼這樣擺 | [`docs/adr/0001-docs-directory-organization.md`](docs/adr/0001-docs-directory-organization.md) |
| 產品要做什麼、驗收標準 | [`docs/design/PRD-MVP.md`](docs/design/PRD-MVP.md) |
| 架構怎麼設計、有什麼風險 | [`docs/design/ARCHITECTURE-EVAL.md`](docs/design/ARCHITECTURE-EVAL.md)（保留原文，頂部標註四處被實測推翻之處） |
| 那些數字（120 種、591 鍵、3546 段、33.5ms）怎麼來的 | [`docs/verification/PHASE0-VERIFICATION.md`](docs/verification/PHASE0-VERIFICATION.md) |
| 現在要做什麼 | `openspec list`（Phase 1 已歸檔於 `openspec/changes/archive/2026-08-25-phase1-chart-engine/`） |

## 目前進度

**Phase 1 已完成（44/44）並歸檔**，見 `openspec/changes/archive/2026-08-25-phase1-chart-engine/`，四份 spec 進入 `openspec/specs/`。版本 0.2.0。

**Phase 2（白話解讀）進行中**，change 為 `openspec/changes/phase2-interpretation/`。已完成第 0 組（8 項決策拍板）、第 1、2 組（敘述層與含義供給層）、第 7 組（營運補洞）。站上目前呈現的仍是**命盤本身**，結果頁改版在第 4 組。Phase 3（分享圖卡）尚未開始。

⚠️ 第 8 組（批次生成 3,546 段）是本專案第一個不可逆成本點，開始前必須通過第 6 組的樣本驗證閘門，且 O1／O4 須有明確結論。

開始批次生成前的兩件事：

- **星曜含義未經命理專業審核。** 排盤四軸與 52 條含義皆未覆核，且**必須在批次生成解讀內容之前**處理——之後再改就是全部重跑（`docs/adr/DECISIONS.md` O1）。
- **B5 觸發條件二已降範圍。** MVP 以人工查看 Vercel 用量頁代替自動告警；對外宣傳、移除存取保護、或任一用量超過上限 50% 時必須重新處理。
