# CLAUDE.md - FamilyPoints 專案指南

## 專案概述

動物森友會風格的家庭積分管理 PWA，部署於 GitHub Pages。

## 開發指令

```bash
npm run dev       # 開發伺服器 (port 3000)
npm run build     # 生產建置
npm run preview   # 預覽建置結果
npm run deploy    # 部署到 GitHub Pages
```

## 架構重點

- **進入點**: `index.html` → `index.tsx` → `App.tsx`
- **狀態管理**: App.tsx 內以 `useState<AppState>` 管理全域狀態，透過 props 傳遞
- **資料持久化**: Firebase Firestore (`userStates/{uid}`)，透過 `services/storageService.ts` 的 `subscribeState` 即時監聽
- **PWA**: `vite-plugin-pwa` 搭配 `registerType: 'prompt'`，更新時由 `components/PWAUpdatePrompt.tsx` 提示使用者
- **部署路徑**: `base: '/Familypoints-Pages/'` — 所有路由和資源路徑都基於此

## 型別定義

所有資料型別定義在 `types.ts`，主要結構為 `AppState` 介面：
- `users`, `scoreItems`, `rewardItems`, `records`, `messages`, `goalRewards`, `discountCards`

## 樣式

- Tailwind CSS 透過 CDN 載入 (非 PostCSS)，自訂色系定義在 `index.html` 的 `tailwind.config`
- 自訂色系前綴: `nook-` (cream, beige, brown, green, blue, orange, yellow, red, paper)
- 字體: Zen Maru Gothic + Varela Round

## 注意事項

- `.env.local` 包含 Firebase 金鑰，不可提交至版控
- `metadata.json` 儲存應用版本資訊
- 修改資料結構時必須同步更新 `types.ts` 和 `services/storageService.ts` 中的 `normalizeAppState`
- 新增頁面/功能時，在 `Dashboard.tsx` 的 tab 系統中加入
