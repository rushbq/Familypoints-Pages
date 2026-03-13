import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigError = missingKeys.length > 0
  ? `Firebase 尚未設定完成，缺少：${missingKeys.join(', ')}`
  : null;

// 只在設定完整時初始化 Firebase，避免 invalid-api-key 錯誤導致整個 App 崩潰
const app = !firebaseConfigError ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null as any;
export const firestore = app
  ? initializeFirestore(app, { localCache: persistentLocalCache({}) })
  : null as any;
