# React 專案部署到 GitHub Pages SOP

## 前提條件
- 已有完整的專案程式碼
- 已安裝 Node.js 和 npm
- 已有 GitHub 帳號

## 步驟 1：建立 GitHub 倉庫

1. 登入 GitHub，點選右上角的 **"+"** → **"New repository"**
2. 填寫倉庫名稱（例如：`my-react-app`）
3. 選擇 **Public**（GitHub Pages 免費版需要公開倉庫）
4. 點選 **"Create repository"**

## 步驟 2：推送程式碼到 GitHub

在專案資料夾中執行：

```bash
# 初始化 git（如果還沒有的話）
git init

# 新增所有檔案
git add .

# 提交
git commit -m "Initial commit"

# 連接到 GitHub 倉庫
git remote add origin https://github.com/你的用戶名/你的倉庫名稱.git

# 推送到 GitHub
git push -u origin main
```

## 步驟 3：修改專案配置

### 3.1 更新 package.json

在 `package.json` 中加入或修改以下內容：

```json
{
  "name": "你的專案名稱",
  "homepage": "https://你的GitHub用戶名.github.io/你的倉庫名稱",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "devDependencies": {
    // 其他套件...
    "@vitejs/plugin-react": "^4.0.0",
    "gh-pages": "^6.1.1"
  }
}
```

### 3.2 建立或更新 vite.config.js/ts

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/你的倉庫名稱/'
})
```

## 步驟 4：安裝必要套件

```bash
# 安裝部署相關套件
npm install --save-dev @vitejs/plugin-react gh-pages

# 或者如果已經有 package.json 的完整配置
npm install
```

## 步驟 5：部署到 GitHub Pages

```bash
# 測試建置是否成功
npm run build

# 部署到 GitHub Pages
npm run deploy
```

部署成功會看到類似訊息：
```
Published
```

## 步驟 6：設定 GitHub Pages

1. 到 GitHub 倉庫頁面
2. 點選 **Settings** 標籤
3. 左側選單點選 **Pages**
4. 在 **Build and deployment** 部分：
   - **Source**: 選擇 `Deploy from a branch`
   - **Branch**: 選擇 `gh-pages`
   - **資料夾**: 選擇 `/ (root)`
5. 點選 **Save**

## 步驟 7：確認部署

1. 等待 2-5 分鐘讓 GitHub 處理部署
2. 到 **Actions** 標籤查看部署狀態
3. 部署完成後，網站會在以下網址上線：
   ```
   https://你的GitHub用戶名.github.io/你的倉庫名稱
   ```

## 未來更新流程

當需要更新網站時：

```bash
# 1. 修改程式碼後，推送到 GitHub
git add .
git commit -m "更新說明"
git push origin main

# 2. 重新部署
npm run deploy
```

## 常見問題解決

### Q1: 出現 "Cannot find package '@vitejs/plugin-react'" 錯誤
```bash
npm install --save-dev @vitejs/plugin-react
```

### Q2: 部署後網站顯示 404 或樣式跑掉
- 確認 `vite.config.js` 中的 `base` 路徑正確
- 確認 `package.json` 中的 `homepage` 網址正確

### Q3: GitHub Pages 顯示 "There isn't a GitHub Pages site here."
- 確認已選擇 `gh-pages` 分支
- 確認已執行 `npm run deploy` 且成功

### Q4: 使用 React Router 時重新整理頁面出現 404
在 `public` 資料夾中建立 `404.html`，內容與 `index.html` 相同。

## 費用說明

- **GitHub Pages 完全免費**
- 限制：每月 100GB 頻寬、1GB 儲存空間
- 只支援靜態網站（前端專案）

## 注意事項

1. 倉庫必須是 **Public**（免費版限制）
2. 每次更新都需要執行 `npm run deploy`
3. 部署需要等待 2-5 分鐘才會生效
4. 網站會自動支援 HTTPS

---

**參考範例：**
- 倉庫：https://github.com/rushbq/LFtime
- 網站：https://rushbq.github.io/LFtime