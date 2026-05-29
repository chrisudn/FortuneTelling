# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint check
```

No test suite is configured.

## Environment

Requires `.env.local` with:
```
OPENAI_API_KEY=sk-...
```

## Architecture

This is a mobile-first Next.js 14 App Router application for I Ching (易經) divination. The layout constrains to `max-w-md` — all UI is designed for phone screens.

### User flow

```
/ (問題輸入)
  → /cast?q=... (硬幣動畫 + 起卦)
    → /result (卦象顯示 + AI 解讀 + 儲存)
      → /history (日記列表)
        → /history/[id] (單筆詳情)
/profile (暱稱設定)
```

### Data flow across the cast flow

The three pages share state via two storage layers — not URL params or React context:

1. `/cast` calls `castHexagram()` (pure random), then saves the raw `CastResult` to **`sessionStorage`** via `saveCastSession()` (`lib/storage.ts`) before navigating to `/result`.
2. `/result` calls `loadCastSession()` to retrieve it, then calls `buildReadingResult()` (`lib/hexagram.ts`) to look up the matching `Hexagram` from the JSON data, and `buildHexagramContext()` (`lib/buildContext.ts`) to assemble the prompt string sent to the AI.
3. The AI chat is streamed from `/api/oracle` (POST). The first response is captured in `aiFirstResponse` state and included when `saveDiaryEntry()` persists to **`localStorage`** (`lib/diary.ts`).

### Key data types

- `CastLine` / `CastResult` — raw coin-throw output (`lib/casting.ts`)
- `CastSession` — what's stored in sessionStorage between `/cast` and `/result`
- `Hexagram` / `ReadingResult` — looked up from `doc/hexagrams/hexagrams.json` (64-entry static dataset)
- `DiaryEntry` — persisted reading record in localStorage
- `UserProfile` — optional nickname, also in localStorage; when present, up to 3 recent diary entries are injected into the AI prompt as context

### Styling

Custom Tailwind theme (`tailwind.config.ts`):
- `bg-paper` / `text-ink` / `text-inkDark` / `bg-vermilion` — core palette (rice-paper aesthetic)
- `font-serif` maps to Noto Serif TC
- `animate-fadeIn` — the only custom animation

### API route

`/api/oracle` streams OpenAI `gpt-4o-mini` responses as plain text (`text/plain; charset=utf-8`). The client in `ChatSection.tsx` reads the stream with `getReader()`. Default 3-round conversation limit per session (`maxRounds` prop).
