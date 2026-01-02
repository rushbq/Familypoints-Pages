# 🏝️ Family Points - 家庭積分系統

一個可愛的動物森友會風格家庭積分管理系統，讓家長可以為孩子的行為加分或扣分，孩子也可以用積分兌換獎勵！

## ✨ 功能特色

- 📊 **積分管理** - 為孩子的好行為加分、壞行為扣分
- 🎁 **獎勵兌換** - 孩子可以用積分兌換獎勵（如玩 Switch、看電視）
- 💌 **悄悄話信箱** - 孩子可以寫信給爸媽
- 📈 **圖表統計** - 視覺化呈現積分趨勢
- 💾 **資料備份** - 支援匯出/匯入備份檔案
- 📱 **響應式設計** - 支援桌面與平板裝置

## 🚀 本地開發

**前置需求:** Node.js

1. 安裝套件：

   ```bash
   npm install
   ```
2. 啟動開發伺服器：

   ```bash
   npm run dev
   ```
3. 開啟瀏覽器前往 http://localhost:3000

## 📦 部署到 GitHub Pages

1. 修改 [vite.config.ts](vite.config.ts) 中的 `base` 路徑為你的倉庫名稱
2. 修改 [package.json](package.json) 中的 `homepage` 為你的 GitHub Pages 網址
3. 執行部署：
   ```bash
   npm run deploy
   ```

詳細步驟請參考 [GitHub Pages 部署 SOP](github_pages_sop.md)

## 🔐 預設密碼

家長登入 PIN 碼預設為 `080987`，可在 [RoleSelector.tsx](components/RoleSelector.tsx) 中修改。

## 💾 資料儲存說明

本系統使用瀏覽器的 **LocalStorage** 儲存資料，這意味著：

- ✅ 完全免費，不需要後端伺服器
- ✅ 資料保留在本地，隱私安全
- ⚠️ 清除瀏覽器快取會遺失資料
- ⚠️ 不同裝置/瀏覽器的資料不同步

**建議：** 定期使用「設定」頁面的備份功能下載備份檔案！

## 🛠️ 技術棧

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Recharts（圖表）
- Lucide React（圖示）
