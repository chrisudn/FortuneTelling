-- 卦語 diary_entries table
-- 在 Supabase Dashboard > SQL Editor 執行此檔案

create table diary_entries (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade not null,
  question              text not null,
  main_hexagram_id      integer not null,
  main_hexagram_name    text not null,
  main_hexagram_unicode text not null,
  changed_hexagram_id   integer,
  changed_hexagram_name text,
  main_lines            smallint[] not null,
  changed_lines         smallint[] not null,
  changing_positions    integer[] not null,
  has_changes           boolean not null,
  ai_first_response     text not null default '',
  ai_conversation       jsonb,
  note                  text not null default '',
  saved_at              timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Row Level Security: 每位用戶只能讀寫自己的資料
alter table diary_entries enable row level security;

create policy "users_own_entries"
  on diary_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
