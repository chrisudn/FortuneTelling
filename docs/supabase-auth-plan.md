# Supabase Auth + 多裝置同步 — Sprint 計畫

## 確認的技術選型

| 項目 | 決策 |
|------|------|
| Auth 方式 | Email Magic Link、Email + 密碼（Sprint 1）、Google OAuth（日後補）|
| 訪客模式 | 允許，不登入仍可占卜（localStorage），登入後才同步雲端 |
| 舊資料遷移 | 不遷移，舊 localStorage 記錄留在裝置上，新記錄才上雲端 |
| 後端 | Supabase（Auth + PostgreSQL + RLS） |

---

## 前置作業（用戶需手動操作）

在 Sprint 1 實作前，需要你完成以下三件事：

### A. 建立 Supabase 專案
1. 前往 [supabase.com](https://supabase.com) 建立帳號並新增專案
2. 記下以下兩個值（Project Settings → API）：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### B. 提供環境變數
完成 A 後，告知我兩個 env vars 的值，我會寫入 `.env.local` 並設定 Vercel 環境。

---

## 資料庫 Schema（供確認）

```sql
create table diary_entries (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade not null,
  question              text not null,
  main_hexagram_id      integer not null,
  main_hexagram_name    text not null,
  main_hexagram_unicode text not null,
  changed_hexagram_id   integer,
  changed_hexagram_name text,
  main_lines            smallint[] not null,     -- 6 元素 [0|1]
  changed_lines         smallint[] not null,     -- 6 元素 [0|1]
  changing_positions    integer[] not null,
  has_changes           boolean not null,
  ai_first_response     text not null default '',
  ai_conversation       jsonb,                   -- {role, content}[]
  note                  text not null default '',
  saved_at              timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Row Level Security：用戶只能讀寫自己的資料
alter table diary_entries enable row level security;

create policy "users_own_entries"
  on diary_entries for all
  using (auth.uid() = user_id);
```

> **注意**：id 改為 UUID（原本 localStorage 用自訂字串 id）。切換後，舊 localStorage 記錄仍可正常讀取，不受影響。

---

## Sprint 計畫

### Sprint 1 — Supabase 基礎 + 登入頁

**目標**：完成三種登入方式，所有現有功能完全不受影響。

**實作範圍**：
- 安裝 `@supabase/ssr`、`@supabase/supabase-js`
- 設定 Supabase 環境變數（本地 + Vercel）
- 執行 DB schema migration
- `/login` 頁面（Magic Link、Email+密碼兩種入口）
- `/auth/callback` route（Supabase 登入後的回調處理）
- Next.js middleware：讀取 session（不攔截任何頁面，純粹刷新 token）

**驗收標準**：
- [ ] Email Magic Link：輸入 email → 收信點連結 → 成功登入
- [ ] Email + 密碼：可以註冊、登入、忘記密碼（發重設信）
- [ ] 登出後回到訪客狀態
- [ ] 所有現有頁面（`/`、`/cast`、`/result`、`/history`、`/profile`）行為完全不變
- [ ] 可部署到 Vercel 並通過以上流程

---

### Sprint 2 — Auth 狀態整合到 UI

**目標**：App 各頁面有一致的登入狀態，暱稱與 Supabase 帳號連結。

**實作範圍**：
- `/profile` 頁面：
  - 已登入：顯示 email + 暱稱（暱稱存入 Supabase user metadata），提供登出按鈕
  - 未登入：現有的暱稱設定行為不變（localStorage）
- 頂部或 profile 頁加入柔性登入引導（例如「登入以同步記錄到雲端 →」）
- AI 提示注入的 UserProfile 來源：已登入時讀 Supabase metadata，未登入時讀 localStorage

**驗收標準**：
- [ ] 已登入用戶可以在 profile 頁修改暱稱，修改後重整頁面暱稱仍在
- [ ] 已登入暱稱在換裝置登入後也能看到
- [ ] 未登入用戶的暱稱設定流程完全不變
- [ ] 登出按鈕可用
- [ ] 可部署到 Vercel

---

### Sprint 3 — 日記寫入 Supabase

**目標**：已登入用戶的新占卜記錄存入 Supabase，訪客繼續用 localStorage。

**實作範圍**：
- `POST /api/diary`（建立新日記，需驗證 session）
- 修改 `saveDiaryEntry` 邏輯：
  - 已登入 → 呼叫 API 寫入 Supabase
  - 未登入 → 現有 localStorage 邏輯不變
- `/result` 頁面：行為不變，只是已登入時資料目的地不同
- 寫入失敗時：顯示提示（不 crash，不 silent fail）

**驗收標準**：
- [ ] 已登入用戶完成占卜 → Supabase `diary_entries` 出現該筆記錄
- [ ] 未登入用戶完成占卜 → 記錄仍在 localStorage，Supabase 無記錄
- [ ] 占卜流程 UX 無任何變化（loading、動畫、跳轉都一樣）
- [ ] 可部署到 Vercel

---

### Sprint 4 — 日記讀取與多裝置同步

**目標**：已登入用戶歷史記錄從 Supabase 讀取，換裝置登入資料一致。

**實作範圍**：
- `GET /api/diary`（取列表，按 saved_at 降序）
- `GET /api/diary/[id]`（取單筆）
- `PATCH /api/diary/[id]`（更新 note）
- `/history` 頁面：已登入時從 Supabase 讀，未登入從 localStorage
- `/history/[id]` 頁面：同上
- `updateDiaryNote` 同步到 Supabase（已登入時）
- AI 上下文（最近 3 筆）：已登入時從 Supabase 讀

**驗收標準**：
- [ ] 裝置 A 登入後占卜 → 裝置 B 登入同帳號 → `/history` 看到同筆記錄
- [ ] 在裝置 A 寫筆記 → 裝置 B 看到同樣的筆記內容
- [ ] AI 占卜時注入的近期記錄，在兩台裝置一致
- [ ] 未登入流程完全不受影響
- [ ] 可部署到 Vercel

---

## 交付原則

- 每個 Sprint 結束都是可獨立部署的狀態
- 訪客（未登入）的完整流程在每個 Sprint 都必須保持正常
- 不做 localStorage 舊資料遷移
- Sprint 順序不可調換（Auth 是其餘 Sprint 的前提）

---

## 待確認事項

完成前置作業 A、B、C 後，告知我以下資訊即可開始 Sprint 1 實作：

1. `NEXT_PUBLIC_SUPABASE_URL` 的值
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` 的值
