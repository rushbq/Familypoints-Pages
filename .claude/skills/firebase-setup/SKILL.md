---
name: firebase-setup
description: Familypoints 的 Firebase 環境變數名稱與 Firestore 安全規則。觸發：碰 services/firebase.ts、CloudLogin.tsx、登入／註冊／驗證流程，或出現「Firebase 設定錯誤」的設定畫面、.env.local 要補變數、Firestore 讀寫被拒（permission-denied）時。不適用：一般的狀態管理或 UI 改動。
---

# Firebase 設定

## `.env.local` 變數名稱

`services/firebase.ts` 只認這六個名字，少一個就會設定 `firebaseConfigError`、整個 app 被設定畫面擋住：

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

範本在 `.env.example`。`.env.local` 已 gitignore（`.gitignore` 的 `.env.*`），**不要**把實際值寫進任何會進版控的檔案，包含 CLAUDE.md、README 或 commit 訊息。

## Firestore 安全規則

每個帳號只能讀寫自己那一份 doc：

```
match /userStates/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

doc 路徑 `userStates/{uid}` 寫死在 `services/storageService.ts`。如果出現 `permission-denied`，先確認 console 上的規則和這份一致，再確認登入的 uid 是不是對的。

## 認證方式

`CloudLogin.tsx` 走 Firebase Email/Password。Firestore 以 `persistentLocalCache()` 開啟本機快取，所以離線時讀得到上次的狀態，連線後才會同步。
