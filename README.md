# 🏝️ Family Points - 家庭積分系統

一個可愛的動物森友會風格家庭積分管理系統，讓家長可以為孩子的行為加分或扣分，孩子也可以用積分兌換獎勵！

**🌐 線上體驗：** [https://rushbq.github.io/Familypoints-Pages](https://rushbq.github.io/Familypoints-Pages)

## ✨ 功能特色

- 📊 **積分管理** - 為孩子的好行為加分、壞行為扣分
- 🎁 **獎勵兌換** - 孩子可以用積分兌換獎勵（如玩 Switch、看電視）
- 💌 **悄悄話信箱** - 孩子可以寫信給爸媽
- 📈 **圖表統計** - 視覺化呈現積分趨勢
- 💾 **資料備份** - 支援匯出/匯入備份檔案
- 🧹 **舊紀錄清理** - 可選擇保留近期資料以節省空間
- 📱 **響應式設計** - 支援桌面與平板裝置
- 🔒 **家長密碼保護** - 設定頁面需輸入 PIN 碼

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

本系統使用瀏覽器的 **IndexedDB** 儲存資料（透過 Dexie.js），相比傳統 LocalStorage 擁有更大容量（50MB+）。

### ✅ 優點

- 完全免費，不需要後端伺服器
- 資料保留在本地，隱私安全
- 儲存容量大，可容納數萬筆紀錄
- 支援複雜查詢與索引

### ⚠️ 使用限制與注意事項

**重要提醒：資料僅存在於當前瀏覽器！**

| 限制項目 | 說明 |
|---------|------|
| 📱 **瀏覽器綁定** | 資料只存在於「同一個裝置的同一個瀏覽器」中，換瀏覽器或換裝置都看不到資料 |
| 🔄 **無法同步** | Chrome 與 Edge 是不同瀏覽器，資料不會互通。手機與電腦也無法同步 |
| 🗑️ **清除快取** | 清除瀏覽器資料、Cookie 或網站資料時，所有積分紀錄都會被刪除 |
| 🔒 **無痕模式** | 無痕/私密瀏覽模式關閉後資料會全部消失，**請勿使用** |
| 🌐 **網域綁定** | 從 GitHub Pages 訪問的資料與本地開發時的資料是分開的 |

### 💡 建議使用方式

1. **固定使用同一台裝置的同一個瀏覽器**
2. **定期備份！** 進入「設定」頁面下載備份檔案（JSON 格式）
3. **避免清除瀏覽器資料**，或清除前先備份
4. 如需更換裝置，可透過「匯入備份」功能還原資料

**建議每週備份一次資料，避免意外遺失珍貴的積分紀錄！**

## 🛠️ 技術棧

- React 19 + TypeScript
- Vite
- Tailwind CSS
- IndexedDB (Dexie.js) - 資料儲存
- Recharts - 圖表視覺化
- Lucide React - 圖示庫
- gh-pages - GitHub Pages 部署

## 📄 授權

本專案採用 MIT 授權條款。

## 🙏 致謝

- 設計靈感來自任天堂《動物森友會》
- 使用 GitHub Pages 免費託管

---

💡 **提示：** 記得定期備份資料！如有任何問題或建議，歡迎到 [GitHub Issues](https://github.com/rushbq/Familypoints-Pages/issues) 回報。
