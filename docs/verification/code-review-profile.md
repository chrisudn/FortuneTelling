# Code Review — Profile 頁面筆數修正 (b129729)

> 審查範圍：`src/app/profile/page.tsx` 與 `src/app/api/diary/route.ts`
> 共 6 個問題，依嚴重程度排序。修完一個請打 `[x]`。

---

## 建議修改順序

| 步驟 | 問題 | 難度 | 說明 |
|------|------|------|------|
| 1 | 問題二（空 catch 吞錯誤） | 易 | 一行 fallback，立刻消除靜默 0 的風險 |
| 2 | 問題五（登出不重置筆數） | 易 | `handleLogout` 末尾加一行 |
| 3 | 問題三（初始 0 閃爍） | 易 | 改 `useState` 初始值，同步讀 localStorage |
| 4 | 問題一 + 四（count 截斷 + 全量 fetch） | 中 | 一起改，動到 API route，改成 count-only 查詢 |
| 5 | 問題六（重複 getProfile） | 易 | render 頂部快取一次即可 |

---

## 問題一：筆數被 API 上限 200 截斷，超過 200 筆的使用者看到錯誤數字

- **檔案：** `src/app/api/diary/route.ts`，第 12 行
- **原因：** `limit` 預設值為 `200`，`entries.length` 最多只會是 200，不反映實際總數。
- **情境：** 使用者有 250 筆紀錄，Profile 頁顯示「200 占卜紀錄」，沒有任何警告。
- **修法：** 改用 count-only 查詢，例如 Supabase 的 `select('id', { count: 'exact', head: true })`，或新增 `/api/diary/count` 端點，不回傳完整資料列。

- [x] 已修正：新增 `src/app/api/diary/count/route.ts`，使用 `count: 'exact', head: true` count-only 查詢

---

## 問題二：空的 `catch {}` 吞掉所有錯誤，顯示錯誤的 0 筆

- **檔案：** `src/app/profile/page.tsx`，第 38 行
- **原因：** `fetch('/api/diary')` 失敗時（網路錯誤、Supabase 5xx 等）例外被靜默吞掉，`entryCount` 永遠停在 `0`，使用者看不到任何提示。`!res.ok`（401、500）的情況也被 `if (res.ok)` 靜默略過。
- **情境：** 網路短暫斷線，使用者看到「0 占卜紀錄」，誤以為紀錄遺失。舊版本直接讀 localStorage，不存在這個問題。
- **修法：** `catch` 裡至少 fallback 到 `setEntryCount(getDiaryEntries().length)`，讓離線或錯誤時仍顯示本地快取數。

```ts
} catch {
  setEntryCount(getDiaryEntries().length)
}
```

- [x] 已修正：`catch` 區塊改為 fallback 至 `getDiaryEntries().length`；`!res.ok` 分支亦同

---

## 問題三：已登入使用者每次開頁面，筆數先閃「0」再跳成正確數字

- **檔案：** `src/app/profile/page.tsx`，第 14 行
- **原因：** `useState(0)` 初始值為 0，async fetch 回來前 UI 就渲染出去了，造成 0→N 的視覺閃動（約 200–800 ms）。舊版本用 `getDiaryEntries().length` 同步初始化，不會閃。
- **情境：** 有 47 筆的使用者打開 Profile，看到「0 占卜紀錄」瞬間閃過才變成 47。
- **修法：** 以 localStorage 的值當同步初始值，等 fetch 成功後再更新：

```ts
const [entryCount, setEntryCount] = useState(() => getDiaryEntries().length)
```

- [x] 已修正：`useState(0)` 改為 `useState(() => getDiaryEntries().length)`，同步初始化避免閃動

---

## 問題四：fetch 全部欄位只為了取 `.length`，浪費頻寬

- **檔案：** `src/app/profile/page.tsx`，第 33 行
- **原因：** `GET /api/diary` 預設回傳所有欄位（包含 `ai_conversation`、`ai_first_response` 等大型欄位），最多 200 筆，但只用到 `entries.length`，其餘資料全部丟棄。
- **情境：** 有 200 筆紀錄的使用者，每次開 Profile 都下載完整 payload，只為了算個數字。
- **修法：** 搭配問題一的修法，改用 count-only 查詢，或傳 `?limit=1` + 讀 response header 的 `count`（若 API 支援）。

- [x] 已修正：搭配問題一，改呼叫 `/api/diary/count`，只傳回 `{ count }` 整數

---

## 問題五：登出後 `entryCount` 未重置，若有本地暱稱會顯示舊的雲端筆數

- **檔案：** `src/app/profile/page.tsx`，第 46 行（`handleLogout`）
- **原因：** `handleLogout` 呼叫 `setAuthUser(null)` 後沒有重設 `entryCount`；若使用者有本地暱稱，統計卡仍然可見，顯示登出前從 Supabase 讀到的舊數字。
- **情境：** 使用者登入時有 12 筆雲端紀錄，登出後本地只有 3 筆，但畫面顯示「12 占卜紀錄」直到重新整理。
- **修法：** 在 `handleLogout` 最後加一行：

```ts
setEntryCount(getDiaryEntries().length)
```

- [x] 已修正：`handleLogout` 末尾加 `setEntryCount(getDiaryEntries().length)`

---

## 問題六：每次 render 重複呼叫 `getProfile()` 多次

- **檔案：** `src/app/profile/page.tsx`，第 83–88 行
- **原因：** `getProfile()` 在 render 函式內被呼叫 3–4 次（分別取 `nickname`、`createdAt` 等），每次都觸發 `localStorage.getItem`，且結果完全相同。
- **情境：** 每次狀態變更重新 render 時，浪費數次同步 IO，代碼閱讀性也較差。
- **修法：** 在 render 頂部呼叫一次並快取：

```ts
const localProfile = getProfile()
// 之後用 localProfile?.nickname, localProfile?.createdAt
```

- [x] 已修正：render 頂部加 `const localProfile = getProfile()`，後續用 `localProfile?.nickname` / `localProfile.createdAt`

---

*產生時間：2026-06-17*
