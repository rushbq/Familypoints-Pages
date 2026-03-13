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
- ☁️ **雲端同步** - 使用 Firebase 登入後，電腦與手機可共用同一份資料
- 🔒 **家長密碼保護** - 設定頁面仍需輸入 PIN 碼

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

## ☁️ Firebase 設定

本專案現在使用 **Firebase Authentication + Cloud Firestore** 作為主資料來源，適合部署在 GitHub Pages 這種純靜態網站上。

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 建立新專案
3. 新增一個 `Web app`
4. 啟用 `Authentication > Sign-in method > Email/Password`
5. 在 `Authentication > Users` 手動建立你自己的帳號
6. 建立 `Cloud Firestore` 資料庫，建議區域選 `asia-east1`

### 2. 設定 Firestore Rules

請在 Firebase Console 的 `Firestore Database > Rules` 貼上：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userStates/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 3. 建立 `.env.local`

複製 [.env.example](.env.example) 為 `.env.local`，然後把 Firebase Web App 提供的設定值填進去：

```bash
cp .env.example .env.local
```

Windows PowerShell 也可以直接手動建立 `.env.local`，內容如下：

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. 第一次資料搬遷

如果你原本已經在某台裝置用過 IndexedDB 版本：

1. 在那台舊裝置先登入新的 Firebase 帳號
2. 系統偵測到雲端還沒有資料時，會自動把本機 IndexedDB 資料搬到 Firestore
3. 之後其他裝置只要登入同一組 Firebase 帳號，就能看到相同資料

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

本系統使用 **Cloud Firestore** 作為主資料來源，瀏覽器本機只保留快取資料，以便加快載入與支援短暫離線狀態。

### ✅ 優點

- GitHub Pages 仍可免費部署
- 同一組 Firebase 帳號可跨裝置同步
- 保留瀏覽器快取，重新開啟速度較快
- 不需要自己架伺服器

### ⚠️ 使用限制與注意事項

**重要提醒：所有裝置必須登入同一組 Firebase 帳號，才會看到同一份資料。**

| 限制項目 | 說明 |
|---------|------|
| 🔐 **帳號綁定** | 手機、平板、電腦都必須登入同一組 Firebase Email/Password |
| 🗑️ **建議備份** | 雲端同步雖然可靠，仍建議定期下載 JSON 備份 |
| 🔒 **無痕模式** | 無痕/私密瀏覽模式不利於保持登入狀態與本機快取，**不建議使用** |
| 🌐 **首次搬遷** | 舊版 IndexedDB 資料只會從你原本使用的裝置搬上雲端一次，請先在原裝置登入新版本 |

### 💡 建議使用方式

1. **所有裝置使用同一組 Firebase 帳號**
2. **第一次上線先用舊裝置登入**，讓舊資料自動搬到雲端
3. **定期備份！** 進入「設定」頁面下載備份檔案（JSON 格式）
4. 如需更換帳號或重建資料，可透過「匯入備份」功能還原資料

**建議每週備份一次資料，避免意外遺失珍貴的積分紀錄！**

## 🛠️ 技術棧

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication - 雲端登入
- Cloud Firestore - 雲端資料儲存
- IndexedDB (瀏覽器快取 / 舊資料搬遷)
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
