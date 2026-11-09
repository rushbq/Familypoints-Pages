---
name: deploy-gh-pages
description: Familypoints 部署到 GitHub Pages 的流程與專案設定。觸發：「部署」「上線」「發佈」「deploy」「gh-pages」「npm run deploy」「線上版沒更新」「部署後 404」「樣式跑掉」，或要改 base / homepage / gh-pages 分支相關設定時。不適用：本機開發（npm run dev 直接跑就好）。
---

# 部署到 GitHub Pages

## 專案既有設定（改動前先確認是不是真的要換部署目標）

| 位置 | 值 |
|---|---|
| `vite.config.ts` → `base` | `/Familypoints-Pages/` |
| `package.json` → `homepage` | `https://rushbq.github.io/Familypoints-Pages` |
| 部署分支 | `gh-pages`（由 `gh-pages -d dist` 推送） |

這兩個值必須和 repo 名稱一致，**只有在換 repo 或換部署目標時才動**。改錯的症狀是部署後白畫面或資源 404（因為 asset 路徑前綴不對）。

## 部署指令

```bash
npm run deploy
```

`predeploy` 會先跑 `npm run build`，所以不需要手動 build。產出的 `dist/` 已經 gitignore，不要 commit。

部署前建議先確認建置與型別都過：

```bash
npm run build
```

（`tsc --noEmit` 由 Stop hook 自動跑，見 `.claude/hooks/typecheck.mjs`。）

## 完整 SOP 與常見問題

第一次設定、或遇到 404 / 樣式跑掉 / 「There isn't a GitHub Pages site here」這類問題，看專案根目錄的 `github_pages_sop.md`——裡面有從建 repo 到設定 Pages 來源的七個步驟和 Q&A。
