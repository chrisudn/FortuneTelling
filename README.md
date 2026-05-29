# 卦語 Guà Yǔ

> 隨時問，隨時記 — 手機優先的易經占卜日記工具

以三硬幣法模擬易經起卦，結合 AI 解讀，讓你隨時能問一卦，並將占卜紀錄儲存為心情日記。

---

## 功能特色

| 功能 | 訪客 | 暱稱用戶 |
|---|---|---|
| 輸入問題 + 起卦 | ✅ | ✅ |
| 查看本卦、之卦、動爻 | ✅ | ✅ |
| AI 解讀對話 | 3 輪 | 10 輪 |
| AI 了解過去問題 | — | ✅ |
| 儲存占卜紀錄 | — | ✅ |
| 加寫心情日記 | — | ✅ |
| 歷史回顧 | — | ✅ |

---

## 技術棧

- **Framework**：Next.js 14（App Router）
- **樣式**：Tailwind CSS + Noto Serif TC
- **AI**：OpenAI gpt-4o-mini（Streaming）
- **資料儲存**：localStorage（MVP 階段）
- **語言**：TypeScript

---

## 快速開始

### 環境需求

- Node.js 18+
- OpenAI API Key

### 安裝與啟動

```bash
# 安裝依賴
npm install

# 複製環境變數範本並填入 API Key
cp .env.local.example .env.local
# 編輯 .env.local，填入 OPENAI_API_KEY

# 啟動開發伺服器
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000)

### 正式建置

```bash
npm run build
npm run start
```

---

## 環境變數

| 變數 | 說明 | 必填 |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API 金鑰 | ✅ |

---

## 專案結構

```
src/
├── app/
│   ├── page.tsx              # 首頁（問題輸入 + 起卦）
│   ├── cast/page.tsx         # 起卦動畫頁
│   ├── result/page.tsx       # 卦象結果 + AI 對話
│   ├── history/page.tsx      # 占卜歷史列表
│   ├── history/[id]/page.tsx # 日記詳情 + 心情編輯
│   ├── profile/page.tsx      # 暱稱設定 / 個人頁
│   └── api/oracle/route.ts   # OpenAI Streaming API
├── components/
│   ├── YaoLine.tsx           # 單爻顯示（陽爻/陰爻/動爻）
│   ├── HexagramDisplay.tsx   # 六爻卦象圖形
│   ├── ChatSection.tsx       # AI 對話區（含 Streaming）
│   └── NavBar.tsx            # 底部導覽列
└── lib/
    ├── casting.ts            # 三硬幣起卦算法
    ├── hexagram.ts           # 64 卦查詢邏輯
    ├── buildContext.ts       # 組裝 AI Prompt Context
    ├── diary.ts              # 日記 localStorage 操作
    └── storage.ts            # 占卜 session 儲存

doc/
├── hexagrams/
│   ├── hexagrams.json        # 64 卦完整資料（卦辭、爻辭）
│   └── all64.md              # 備查文件
└── development-plan.md       # 開發計畫與驗收檢核表
```

---

## 起卦邏輯

模擬傳統**三硬幣法**，每次投擲三枚硬幣，連續 6 次：

| 正面數 | 術語 | 爻性質 | 是否動爻 |
|---|---|---|---|
| 3 正面 | 老陽 | 陽爻 → 變陰 | ✅ |
| 2 正面 | 少陰 | 陰爻（靜） | — |
| 1 正面 | 少陽 | 陽爻（靜） | — |
| 0 正面 | 老陰 | 陰爻 → 變陽 | ✅ |

有動爻時，自動計算**之卦**（變後卦象），並在 AI 解讀中說明本卦→之卦的轉變意義。

---

## 視覺設計

| 設計元素 | 說明 |
|---|---|
| 配色 | 深墨綠 `#1A3C34`、硃砂紅 `#C0392B`、米白宣紙 `#FAF3E0` |
| 字體 | Noto Serif TC（古典中文襯線字體） |
| 背景 | CSS 橫紋紙質紋理 |
| 爻線 | CSS 繪製（無圖片依賴） |
| 觸控 | 最小觸控高度 56px，以長輩友善為標準 |

---

## 開發進度

| Phase | 內容 | 狀態 |
|---|---|---|
| Phase 0 | 64 卦資料 + 起卦算法 | ✅ 完成 |
| Phase 1 | 核心占卜流程（問題→動畫→結果） | ✅ 完成 |
| Phase 2 | AI 解讀對話（OpenAI Streaming） | ✅ 完成 |
| Phase 3 | 暱稱身分 + 日記儲存 + 歷史回顧 | ✅ 完成 |
| Phase 4 | 視覺精修 + 無障礙 | ✅ 完成 |
| 未來 | 後端資料庫、正式登入、多裝置同步 | 規劃中 |

---

## 驗收測試

```bash
# Phase 0 資料驗收
node scripts/verify-phase0.mjs
```

---

## 授權

Private — 版權所有
