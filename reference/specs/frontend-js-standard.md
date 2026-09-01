# ✅ 前端 JS/TS 開發規範（React / Next.js・Vue / Nuxt 通用，公司規範級）

> 目標：**避免所有東西都叫 `utils.ts`、所有變數都叫 `data`**，導致責任邊界模糊、元件爆肥、狀態四散、外部資料未經驗證就進入畫面。
>
> 適用範圍：所有以 TypeScript 撰寫的前端專案，含 React（Next.js App Router）與 Vue（Nuxt 4）。這份是**跨專案共用規範**，不放任何單一專案的商業邏輯；專案自己的設計文件放該專案的 `docs/`。

## 強制等級用語

| 用語 | 意義 |
|---|---|
| **MUST** / **MUST NOT** | 違反視為缺陷，PR 應被退回。能以 lint 擋的一律設成 lint error |
| **SHOULD** | 預設遵循；要例外必須在 PR 描述寫明理由 |
| **MAY** | 團隊或專案可自行選擇，選了就要全專案一致 |

---

## 1. 分層責任定義（必讀）

前端沒有後端那種由編譯期強制的分層，唯一能守住的方式是**目錄邊界 + lint 規則**。四層責任如下：

### 1.1 App / Routing Layer（路由層）
`app/`（Next.js）、`app/pages/` + `app/layouts/`（Nuxt）

- ✅ 路由、頁面組裝、layout、metadata/SEO、載入與錯誤邊界
- ✅ 決定資料在哪裡取得（server 或 client），把資料往下傳
- ✅ 動作入口（Server Action / server route handler）
- ❌ **MUST NOT** 寫商業規則
- ❌ **MUST NOT** 直接呼叫第三方 SDK（要經由 `lib/`）

### 1.2 Feature Layer（功能層）
`features/<feature-name>/`

- ✅ 一個功能垂直切分的全部內容：元件、資料存取、狀態、型別、該功能專屬邏輯
- ✅ 對外只透過該 feature 的 barrel（`index.ts`）曝露必要介面
- ❌ **MUST NOT** import 另一個 feature（見 §2）

### 1.3 Shared Layer（共用層）
`components/`（純呈現）、`hooks/`（React）、`composables/`（Vue）、`lib/`（第三方封裝）、`utils/`（純函數）、`types/`、`config/`

- ✅ 與商業領域無關、可被任何 feature 使用的東西
- ✅ `lib/` 是第三方套件的**唯一**進入點（HTTP client、日期、分析、i18n 都在此預先設定好）
- ❌ **MUST NOT** import `features/` 或 `app/`
- ❌ `components/` 內的元件 **MUST NOT** 自行取資料，資料一律由 props 傳入

### 1.4 Domain / Core Layer（領域層，選用但強烈建議）
`core/`、`domain/` 或獨立的 workspace package

- ✅ 純函數的商業規則、計算、驗證、型別
- ✅ 可在 Node 與瀏覽器兩邊執行
- ❌ **MUST NOT** import 任何 UI 框架（`react`、`vue`、`next`、`nuxt`）、任何 CSS
- ❌ **MUST NOT** 依賴 `window`、`document`、`localStorage`

> **為什麼要獨立 `core/`**：前端框架是壽命最短的一層。把不隨框架改變的規則隔離出來，換框架時這包完全不用動。**MUST** 以自動檢查強制（見 §12.3），不靠自律。

---

## 2. 依賴方向（MUST，以 lint 強制）

```
core / domain  ←  shared  ←  features  ←  app
（箭頭為「被依賴」方向；反向 import 一律禁止）
```

三條硬規則：

1. **`app/` 可以 import `features/` 與 shared；反向不行。**
2. **`features/A` MUST NOT import `features/B`。** 需要共用就往下沉到 shared 層，或由 `app/` 層負責組裝。
3. **shared 層 MUST NOT import `features/` 或 `app/`。**

React 專案以 `eslint-plugin-import` 的 `import/no-restricted-paths` 落地（bulletproof-react 的做法）：

```js
// eslint.config.js
'import/no-restricted-paths': ['error', {
  zones: [
    // 1) feature 之間互不相通
    { target: './src/features/a', from: './src/features', except: ['./a'] },
    { target: './src/features/b', from: './src/features', except: ['./b'] },
    // 2) shared 不得反向依賴
    { target: './src/components', from: ['./src/features', './src/app'] },
    { target: './src/hooks',      from: ['./src/features', './src/app'] },
    { target: './src/lib',        from: ['./src/features', './src/app'] },
    { target: './src/utils',      from: ['./src/features', './src/app'] },
    { target: './src/types',      from: ['./src/features', './src/app'] },
    // 3) features 不得依賴 app
    { target: './src/features',   from: './src/app' },
  ],
}],
```

Nuxt 專案以 [Nuxt Layers](https://nuxt.com/docs/4.x/directory-structure/layers) 或 `eslint-plugin-boundaries` 達到同樣效果；**選一種並在專案 README 寫明**。

> ⚠️ Nuxt 的 auto-import 會讓「誰依賴誰」變成隱形的。**MUST** 在 CI 跑依賴檢查，否則這一節等於沒寫。

---

## 3. 目錄結構（MUST）

### 3.1 Next.js App Router

```
src/
├─ app/                    # 路由：page.tsx / layout.tsx / route.ts / error.tsx / loading.tsx
├─ features/
│   └─ <feature>/
│       ├─ api/            # 該功能的資料存取（fetch + query/mutation hook）
│       ├─ components/     # 該功能專屬元件
│       ├─ hooks/
│       ├─ stores/
│       ├─ schemas/        # zod / valibot schema
│       ├─ types/
│       ├─ utils/
│       └─ index.ts        # 對外唯一出口（barrel）
├─ components/             # 跨 feature 的純呈現元件（含 ui/ 設計系統元件）
├─ hooks/  lib/  utils/  types/  config/  stores/
├─ testing/                # test utils、MSW handlers、fixtures
└─ core/ 或獨立 package     # 純領域邏輯（選用）
```

- **`features/<feature>/` 只放該 feature 真正需要的子目錄**，不要為了對稱先建空資料夾。
- **MUST** 從 barrel import：`import { BirthForm } from '@/features/birth-input'`；**MUST NOT** 深入內部路徑 `@/features/birth-input/components/BirthForm/BirthForm`。
- `app/` 內 **SHOULD** 只有薄薄的組裝層。`page.tsx` 超過約 100 行就是該往 feature 搬的訊號。

### 3.2 Nuxt 4

```
app/
├─ pages/        # 路由（檔案即路由）
├─ layouts/
├─ components/   # 自動註冊；子目錄名會成為元件名前綴
├─ composables/  # 自動 import（只掃 composables/*.ts 與 composables/index.ts）
├─ utils/        # 自動 import 的純函數，與 composables 的差別是「不含 Vue 響應式」
├─ middleware/  plugins/  assets/
└─ app.vue
server/          # server routes / api / middleware（僅在伺服器執行）
shared/          # server 與 app 共用的型別與純函數
modules/  layers/
```

- **Nuxt 4 已把 `components/`、`composables/`、`pages/` 等移入 `app/`**；新專案 **MUST** 採用此結構，不要沿用 Nuxt 3 的根目錄擺法。
- `app/composables/` **只掃描第一層**（`composables/useFoo.ts` 與 `composables/index.ts`）。**巢狀目錄 MUST 由 `index.ts` re-export**，否則 auto-import 會靜默失效——這是最常見的「為什麼我的 composable 不見了」。
- `app/utils/` 與 `app/composables/` 的掃描規則相同，差別純粹是語意：**含響應式狀態或生命週期的放 `composables/`，純函數放 `utils/`。**
- 只在伺服器用的東西 **MUST** 放 `server/`，避免被打包進 client bundle。

---

## 4. 命名規範

### 4.1 檔案與目錄（MUST）

| 對象 | 規則 | 範例 |
|---|---|---|
| React 元件檔 | `PascalCase.tsx` | `BirthForm.tsx` |
| Vue SFC | `PascalCase.vue` | `BirthForm.vue` |
| Hook / Composable | `useXxx.ts` | `useBirthInput.ts` |
| 純函數模組 | `kebab-case.ts` | `format-hour-range.ts` |
| 型別專屬檔 | `kebab-case.types.ts` | `chart.types.ts` |
| schema | `kebab-case.schema.ts` | `birth-input.schema.ts` |
| 測試 | 與被測檔同名 + `.test.ts(x)` | `BirthForm.test.tsx` |
| 目錄 | `kebab-case` | `features/birth-input/` |
| 常數模組 | 檔名 `kebab-case.ts`，內容 `SCREAMING_SNAKE` | `hour-options.ts` |

- **MUST NOT** 用 `index.tsx` 當元件本體（僅限 barrel 用途）。編輯器裡開十個 `index.tsx` 無法分辨是災難。
- **MUST NOT** 出現無意義的桶底檔名：`utils.ts`、`helpers.ts`、`common.ts`、`misc.ts`、`data.ts`。以功能命名：`format-currency.ts`、`clamp.ts`。

### 4.2 元件命名（MUST）

- **多字命名**：元件名 **MUST** 至少兩個字，避免與 HTML 元素衝突（Vue 官方 Priority A）。`Button` ❌ → `AppButton` / `UiButton` ✅（React 專案若已有 `ui/` 目錄可豁免，但同一專案內要一致）。
- **設計系統元件加前綴**：`Base*` / `App*` / `Ui*` 三者擇一，全專案統一。
- **緊耦合的子元件 MUST 以父元件名為前綴**：`ChartCard.tsx`、`ChartCardHeader.tsx`、`ChartCardStarList.tsx`。這讓相關檔案在檔案樹中自然聚在一起，也讓「這個元件能不能單獨重用」一眼可判。
- **命名由通用到專屬**：`SearchInputQueryClearButton`，不是 `ClearButtonForQueryOfSearchInput`。
- **MUST NOT** 用縮寫：`BtnGrp` ❌ → `ButtonGroup` ✅。例外只有 `id`、`url`、`api`、`db`、`i18n` 這類已成通用詞者。

### 4.3 Hook / Composable（MUST）

- **MUST** 以 `use` 開頭、camelCase：`useChartQuery`、`useHourGuidance`。
- 一個 hook 只做一件事。回傳超過 5 個欄位、或名字裡出現 `And`，就是該拆的訊號。
- **MUST NOT** 在 hook 名稱裡藏元件名（`useBirthFormThings` ❌）——hook 應該可被多個元件使用。
- 回傳值 **SHOULD** 用具名物件而非陣列，除非只有兩個值且順序天然（如 `[value, setValue]`）。

### 4.4 資料模型命名（MUST）

這是前端最容易混成一團的地方——同一個「使用者」在四個層次有四種形狀，**MUST** 用名字區分：

| 層次 | 命名 | 說明 |
|---|---|---|
| 外部 API 原始回應 | `XxxDto` / `XxxResponse` | 後端給的形狀，欄位可能是 snake_case、可能有 null |
| 送往外部的請求 | `XxxRequest` / `XxxPayload` | 送出去的形狀 |
| 領域模型 | 裸名詞（`Chart`、`Palace`） | 前端內部使用的正規形狀，欄位齊全、無 null 曖昧 |
| 畫面模型 | `XxxVm` / `XxxViewModel` / `XxxProps` | 已格式化成可直接渲染的字串／旗標 |

- **MUST** 在資料進入應用時就完成 `Dto → 領域模型` 的轉換，轉換函數放 `features/<f>/api/` 或 `lib/`。**MUST NOT** 讓 `snake_case` 的 DTO 欄位一路流到 JSX/template。
- **MUST NOT** 把畫面模型叫 `VO`。前端沒有 DDD Value Object 的語境，`VO` 只會造成跨團隊誤解（後端規範中 `VO` 指 domain value object）。
- **MUST NOT** 用 `data`、`item`、`obj`、`info`、`res`、`temp`、`foo` 當變數名。`res` 例外只允許在 3 行內立即解構的 fetch 結果。

### 4.5 布林與函式（MUST）

- 布林 **MUST** 以 `is` / `has` / `can` / `should` 開頭：`isLoading`、`hasBirthHour`、`canSubmit`。**MUST NOT** 用否定命名（`isNotReady` ❌ → `isReady` ✅）。
- 事件：React prop 用 `onXxx`，內部實作函式用 `handleXxx`。

```tsx
<BirthForm onSubmit={handleSubmit} />   // prop = onXxx，實作 = handleXxx
```

- Vue：`defineEmits` 的事件名用 kebab-case（`@submit-success`）；props 宣告用 camelCase，template 上用 kebab-case。
- 函式 **MUST** 以動詞開頭：`getChart`、`buildFacts`、`normalizePalaceName`。回傳布林者用 `isXxx` / `hasXxx`。

### 4.6 常數與列舉

- 模組層級常數 **MUST** 用 `SCREAMING_SNAKE_CASE` 並 `as const`。
- **SHOULD** 用 `as const` 物件 + union type 取代 TS `enum`（`enum` 會產生額外執行期程式碼，`const enum` 又與 `isolatedModules` 衝突）：

```ts
export const HOUR_MODE = { known: "known", unknown: "unknown" } as const;
export type HourMode = typeof HOUR_MODE[keyof typeof HOUR_MODE];
```

---

## 5. 元件分類標準

對應後端規範的 stereotype annotation：每個檔案 **MUST** 能被歸到唯一一類，混類是元件爆肥的起點。

### 5.1 通用三分類（MUST）

| 類別 | 職責 | 可否取資料 | 可否有狀態 |
|---|---|---|---|
| **Presentational**（`components/`） | 只依 props 渲染 | ❌ | 僅 UI 局部狀態（開合、hover） |
| **Container / Feature**（`features/*/components/`） | 組合資料與呈現 | ✅ | ✅ |
| **Route / Page**（`app/`） | 路由、佈局、metadata、錯誤邊界 | ✅（首選在此取） | ❌ 業務狀態 |

### 5.2 React / Next.js App Router（MUST）

- **預設 Server Component。** 只有真正需要互動（事件、`useState`、`useEffect`、瀏覽器 API）才加 `"use client"`。
- **`"use client"` MUST 放在葉節點附近**，不要放在 layout 或 page 頂端——那等於把整棵子樹送進 client bundle。
- **MUST NOT** 在 Server Component 內 import 只能在 client 執行的套件；需要時用 `next/dynamic` 且 `ssr: false`。
- Server Action **MUST** 視為公開 HTTP 端點：一律重新驗證輸入與權限（見 §7）。
- 資料取得 **SHOULD** 盡量上移到 Server Component，client 只負責互動。

### 5.3 Nuxt / Vue（MUST）

| 位置 | 職責 | 禁止 |
|---|---|---|
| `app/pages/` | 路由入口、`definePageMeta`、頁面級資料取得 | 商業規則 |
| `app/layouts/` | 框架與導覽 | 業務狀態 |
| `app/components/` | 呈現與互動 | 直接打第三方 API（要經 composable / `lib/`） |
| `app/composables/` | 響應式狀態與邏輯復用 | 直接操作 DOM |
| `app/utils/` | 純函數 | 任何 `ref`／`computed`／生命週期 |
| `app/middleware/` | 路由守衛 | 資料取得 |
| `server/` | 伺服器端 route / api / middleware | 引用 `app/` 內的元件 |

- **MUST** 使用 `<script setup lang="ts">`。
- **MUST** 用 `defineProps<T>()` / `defineEmits<T>()` 的型別式宣告，不用執行期物件式宣告。
- `v-for` **MUST** 有穩定的 `key`，且 **MUST NOT** 與 `v-if` 用在同一元素（Vue Priority A）。
- 跨元件且需 SSR-safe 的狀態用 `useState()`；**MUST NOT** 用模組層級的 `ref` 當全域狀態——那在 SSR 會跨請求汙染。

---

## 6. 狀態管理分層（MUST）

前端最常見的架構錯誤是「把所有東西塞進一個全域 store」。狀態 **MUST** 先分類再選工具：

| 種類 | 定義 | 工具 | 禁止 |
|---|---|---|---|
| **Server state** | 真相在後端，前端只是快取 | TanStack Query / `useFetch`·`useAsyncData` / RSC | **MUST NOT** 複製進全域 store 再手動同步 |
| **URL state** | 該可分享、可重整、可上一頁的（分頁、篩選、tab） | `searchParams` / `useRoute` | **MUST NOT** 只存在元件內部 state |
| **Form state** | 使用者正在編輯、尚未送出 | react-hook-form / VeeValidate / 原生 | **MUST NOT** 每次按鍵寫進全域 store |
| **UI state** | 開合、hover、focus | 元件內 `useState` / `ref` | **MUST NOT** 放全域 |
| **Global client state** | 真正跨頁共享且非伺服器來源（主題、語言、匿名 ID） | Zustand / Pinia | 只放這幾類，其餘一律不進 |

判斷順序 **MUST** 是：能不能算出來（derive）→ 能不能放 URL → 能不能放最近的共同父層 → 最後才考慮全域。

---

## 7. 邊界驗證（MUST）

對應後端規範的「驗證責任分層」。前端的關鍵差異：**任何來自瀏覽器的東西都不可信，包含你自己寫的前端送出的資料。**

| 邊界 | 責任 | 做法 |
|---|---|---|
| 外部 API 回應 | **MUST** 解析驗證 | `schema.parse(json)`（zod / valibot）；**MUST NOT** 用 `as XxxDto` 硬轉 |
| URL / searchParams / route params | **MUST** 解析驗證 | 皆為 `string \| undefined`，一律 parse 後再用 |
| `localStorage` / cookie / postMessage | **MUST** 解析驗證 | 內容可被使用者任意編輯，也可能是舊版格式 |
| 表單輸入 | **MUST** 驗證 | schema 與提交端共用同一份 |
| Server Action / Route Handler | **MUST** 重新驗證 | 前端驗證只是 UX，**不是**安全邊界 |
| 元件 props | 不驗證 | 由 TypeScript 保證，執行期不再檢查 |
| 領域函數（`core/`） | **MUST** 自我守衛 | 多入口（頁面＋API＋批次腳本）時這是最後防線，違反不變式就丟錯 |

- schema **MUST** 是型別的唯一來源：`type BirthInput = z.infer<typeof birthInputSchema>`。不要手寫一份 interface 再手動同步。
- **MUST NOT** 出現 `as any`、`as unknown as T`、`@ts-ignore`。真的需要時用 `@ts-expect-error` 並在同一行寫明理由。
- 錯誤訊息 **MUST** 分兩套：給使用者看的（白話、可行動）與給日誌看的（技術細節）。**MUST NOT** 把後端原始錯誤直接顯示給使用者。

---

## 8. TypeScript（MUST）

- `tsconfig.json` **MUST** 開啟 `strict`，並 **SHOULD** 加開 `noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`noImplicitOverride`。
- **MUST NOT** 使用 `any`。不知道形狀時用 `unknown` 再 narrow。
- **MUST** 用 discriminated union 表達互斥狀態，**MUST NOT** 用一堆可選欄位：

```ts
// ❌ 可以同時 loading 又有 error，型別無法阻止不合法的組合
type State = { loading?: boolean; data?: Chart; error?: Error };

// ✅ 不合法的狀態根本無法被表達
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; chart: Chart }
  | { status: "error"; error: Error };
```

- 公開 API 的物件型別 **SHOULD** 標 `readonly`，避免下游意外變更共用資料。
- `type` 與 `interface`：物件形狀且需要被 extend 用 `interface`，其餘用 `type`。**選一套並全專案一致。**
- **MUST NOT** 從 `node_modules` 深層路徑 import 型別。

---

## 9. 副作用與響應式（MUST）

**`useEffect` / `watch` 是逃生門，不是資料流工具。** 以下情況 **MUST NOT** 用 effect：

- 可以在 render 期間算出來的衍生值 → 直接算，或 `useMemo` / `computed`
- 回應使用者事件 → 寫在 event handler 裡
- 取資料 → 用 query 函式庫或在 server 端取得

其餘規則：

- effect **MUST** 處理清理（`return () => ...` / `onScopeDispose`）與競態（`AbortController`，或忽略過期回應）。
- **MUST NOT** 為了「讓 lint 閉嘴」而刪 dependency array 成員；要嘛修好邏輯，要嘛寫明為何忽略。
- **MUST NOT** 在 effect 裡直接 set 同一個元件的 state 造成連鎖 render。
- Vue：**MUST NOT** 在 `computed` 內產生副作用（發請求、改其他 state）。

---

## 10. 樣式（MUST）

- 全專案 **MUST** 只選一種主要方案（Tailwind / CSS Modules / vanilla-extract），不混用。
- **MUST NOT** 出現硬編碼色碼與間距魔數；一律用 design token（Tailwind theme、CSS custom property）。
- **MUST NOT** 使用 `!important`（覆寫第三方樣式且已註明理由者除外）。
- **MUST NOT** 在 JSX/template 內組合超長的條件式 class 字串；用 `clsx` / `cva` 抽成變體（variant）。
- 響應式 **MUST** mobile-first：先寫小螢幕，再用 `sm:`／`md:` 往上加。
- 深色模式與主題 **MUST** 走 token 切換，不寫兩套元件。

---

## 11. 可及性與語意（MUST）

- 互動元素 **MUST** 用正確的原生標籤：可點擊用 `<button>`，導航用 `<a>`。**MUST NOT** 用 `<div onClick>`。
- 每個表單輸入 **MUST** 有關聯的 `<label>`（或 `aria-label`）。
- 圖片 **MUST** 有 `alt`；純裝飾用 `alt=""`。
- **MUST NOT** 用 `outline: none` 移除焦點樣式而不提供替代。
- 顏色對比 **MUST** 達 WCAG AA（正文 4.5:1）。**MUST NOT** 只用顏色傳達狀態。
- 動畫 **MUST** 尊重 `prefers-reduced-motion`。
- **SHOULD** 在 CI 跑 `eslint-plugin-jsx-a11y` / `eslint-plugin-vuejs-accessibility`。

---

## 12. 配置與環境變數（MUST）

### 12.1 分層與優先順序

載入順序（低→高）：`程式碼內預設值` < `.env` < `.env.<mode>` < `執行環境注入的變數`。

- **MUST** 有 `.env.example` 列出所有必要的 key（值留空或填假值），並納入版本控制。
- **MUST NOT** 把 `.env`、`.env.production` 或任何含真實憑證的檔案進版控。
- **MUST** 集中在單一 `config/env.ts` 讀取並用 schema 驗證，啟動時就 fail fast：

```ts
// config/env.ts —— 全專案唯一讀 process.env 的地方
export const env = envSchema.parse({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  // …
});
```

- **MUST NOT** 在元件或 feature 內散落 `process.env.X` / `import.meta.env.X`。

### 12.2 公開變數的洩漏風險（MUST）

- Next.js 的 `NEXT_PUBLIC_*`、Vite 的 `VITE_*`、Nuxt 的 `runtimeConfig.public.*` **會被打進 client bundle，等同公開**。
- **MUST NOT** 把任何 secret（API key、DB 連線字串、簽章金鑰）放進上述前綴。
- Nuxt **MUST** 區分 `runtimeConfig`（僅伺服器）與 `runtimeConfig.public`（公開）。
- **SHOULD** 在 CI 加檢查：掃描 client bundle 是否出現 secret 樣式的字串。

### 12.3 架構約束以檢查強制（SHOULD，強烈建議）

把「不該發生的事」寫成 CI 會擋的腳本，而不是寫在文件裡等人記得。常見三項：

| 檢查 | 擋住什麼 |
|---|---|
| 依賴白名單（`core/` 的 `package.json`） | UI 框架被裝進純邏輯套件 |
| 禁用 API 掃描 | 特定層出現 `Date`／`window`／`process.env` 等不該有的呼叫 |
| import 邊界（`import/no-restricted-paths`） | 跨 feature import、shared 反向依賴 |

---

## 13. 效能（SHOULD，除標示 MUST 者）

- 列表 **MUST** 有穩定唯一的 `key`；**MUST NOT** 用陣列 index 當 key（除非列表永不重排、增刪）。
- **MUST NOT** 預設到處包 `memo` / `useMemo` / `useCallback`。先量測，有實據再加。
- 圖片 **MUST** 用框架的圖片元件（`next/image`、`NuxtImg`），或自行指定 `width`/`height` 以避免 CLS。
- 大型且非首屏必要的元件 **SHOULD** 動態載入。
- **SHOULD** 設 bundle 預算並在 CI 監控；超標視為缺陷而非「之後再說」。
- 字體 **SHOULD** 自架或使用框架的字體最佳化，避免 render-blocking 與 CLS。

---

## 14. 測試（MUST）

| 層級 | 對象 | 工具 |
|---|---|---|
| Unit | 純函數、`core/`、schema | Vitest |
| Component | 元件的可觀察行為 | Vitest + Testing Library |
| Integration | feature 內多元件 ＋ mock 網路 | Testing Library + MSW |
| E2E | 關鍵使用者流程（happy path ＋ 主要失敗路徑） | Playwright |

- **MUST** 測「使用者看得到／做得到的行為」；**MUST NOT** 斷言內部 state、私有函式，或快照整棵 DOM。
- 查詢元素 **MUST** 優先用可及性查詢（`getByRole`、`getByLabelText`）；`data-testid` 是最後手段。
- **MUST NOT** mock 自己的 `core/`／領域函數——那等於沒測。mock 只用於網路、時間、隨機數。
- 涉及時間或隨機的邏輯 **MUST** 以參數注入，讓測試可決定性重現。
- 修 bug **MUST** 先補一個會失敗的測試再修。

---

## 15. 明確禁止清單（MUST NOT）

1. `any`、`as unknown as T`、`@ts-ignore`
2. `console.log` 留在提交的程式碼中（刻意保留的結構化 logger 除外）
3. 在元件檔內直接 `fetch` 第三方 API（要經 `features/*/api/` 或 `lib/`）
4. `features/A` import `features/B`
5. shared 層 import `features/` 或 `app/`
6. `utils.ts` / `helpers.ts` / `common.ts` 這類無意義桶底檔
7. secret 放進 `NEXT_PUBLIC_*` / `VITE_*` / `runtimeConfig.public`
8. 用 `<div onClick>` 當按鈕
9. 把 server state 複製進全域 store 再手動同步
10. 用 `useEffect` 取代「可以直接算」或「該寫在 event handler」的邏輯
11. 硬編碼色碼與間距魔數
12. commit 註解掉的整段程式碼（交給版本控制）

---

## 16. Code Review Checklist（提交前自我檢查）

**分層與命名**
- [ ] 有沒有 feature 互相 import？shared 層有沒有反向依賴 `features/`／`app/`？
- [ ] 新檔案能否明確歸到 §5 的唯一一類？`page.tsx` 有沒有塞商業邏輯？
- [ ] 有沒有 `utils.ts`、`data`、`info`、`res` 這類無資訊量的命名？
- [ ] DTO 的 `snake_case` 欄位有沒有流到 JSX/template？

**型別與邊界**
- [ ] 外部資料（API／URL／localStorage）是 parse 進來，還是 `as` 硬轉？
- [ ] Server Action / Route Handler 有沒有重新驗證輸入？
- [ ] 有沒有新增 `any` / `@ts-ignore`？
- [ ] 互斥狀態是 discriminated union，還是一堆 optional flag？

**狀態與副作用**
- [ ] 新增的狀態走過「derive → URL → 就近父層 → 全域」的判斷了嗎？
- [ ] 新增的 `useEffect`／`watch` 是真的需要，還是可以改寫成衍生值或 event handler？
- [ ] effect 有清理與競態處理嗎？

**框架特定**
- [ ] React：`"use client"` 是不是放在葉節點附近？有沒有把整棵子樹推進 client bundle？
- [ ] Nuxt：巢狀 composable 有沒有從 `index.ts` re-export？有沒有用模組層級 `ref` 當全域狀態？

**品質**
- [ ] 表單有 label 嗎？互動元素是原生標籤嗎？焦點樣式還在嗎？
- [ ] 有沒有 secret 進到公開前綴的環境變數？
- [ ] 修的 bug 有對應的失敗測試嗎？
- [ ] 有沒有留 `console.log` 或註解掉的程式碼？

---

## 參考來源

本規範整合下列公開資料，並依「能不能被 lint 強制」與「違反會不會造成實際傷害」兩個標準取捨：

- [bulletproof-react — Project Structure 與單向依賴規則](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [Vue.js 官方 Style Guide（Priority A / B）](https://vuejs.org/style-guide/)
- [Nuxt 4 Directory Structure](https://nuxt.com/docs/4.x/directory-structure) / [composables 掃描規則](https://nuxt.com/docs/4.x/directory-structure/app/composables)
- [Next.js — Project Structure 與 App Router 慣例](https://nextjs.org/docs/app/getting-started/project-structure)
- [React 官方 — You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [TkDodo — Practical React Query（server state 與 client state 的分界）](https://tkdodo.eu/blog/practical-react-query)
- [WCAG 2.2 AA Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
