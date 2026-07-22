import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { saveState, SaveResult, subscribeState } from './services/storageService';
import {
  AppState,
  DiscountCard,
  GoalReward,
  RewardCard,
  RewardItem,
  ScoreItem,
  ScoreRecord,
  SecretMessage,
  StampCard,
  User,
  UserRole,
} from './types';
import { RoleSelector } from './components/RoleSelector';
import { Dashboard } from './components/Dashboard';
import { CloudLogin } from './components/CloudLogin';
import { PreviewHarness } from './components/PreviewHarness';
import { auth, firebaseConfigError } from './services/firebase';
import {
  addGardenPositivePoints,
  startFamilyGardenPlant,
  waterFamilyGarden,
} from './services/gardenUtils';

/**
 * 應用程式主元件
 * 負責全域狀態管理 (State Management) 與資料持久化 (Persistence)
 * 目前使用 Firebase Auth + Cloud Firestore 進行雲端同步
 */
const App: React.FC = () => {
  // 全域狀態
  const [data, setData] = useState<AppState | null>(null);
  // 目前登入的使用者
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Firebase 雲端登入使用者
  const [cloudUser, setCloudUser] = useState<FirebaseUser | null>(null);
  // Firebase 驗證狀態
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  // 載入狀態
  const [isLoading, setIsLoading] = useState(true);
  // 錯誤狀態
  const [error, setError] = useState<string | null>(null);
  // 儲存警告（空間不足時顯示）
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const lastSyncedStateRef = useRef<string | null>(null);

  // 初始化：監聽 Firebase 登入狀態
  useEffect(() => {
    if (firebaseConfigError || !auth) {
      setIsAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCloudUser(user);
      setCurrentUser(null);
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  // Firebase 登入後，開始監聽 Firestore 雲端資料
  useEffect(() => {
    if (!cloudUser) {
      setData(null);
      setIsLoading(false);
      lastSyncedStateRef.current = null;
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeState(
      (loadedData) => {
        lastSyncedStateRef.current = JSON.stringify(loadedData);
        setData(loadedData);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error('載入雲端資料失敗:', err);
        setError('載入雲端資料失敗，請重新整理頁面');
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [cloudUser]);

  // 儲存資料的函式
  const persistData = useCallback(async (newData: AppState) => {
    const serializedState = JSON.stringify(newData);

    if (serializedState === lastSyncedStateRef.current) {
      return;
    }

    const result: SaveResult = await saveState(newData);
    
    if (!result.success) {
      setSaveWarning(`⚠️ 儲存失敗: ${result.error}`);
      setTimeout(() => setSaveWarning(null), 5000);
    } else {
      lastSyncedStateRef.current = serializedState;
    }
  }, []);

  // 監聽資料變更：當 data 改變時，自動寫入 Firestore
  useEffect(() => {
    if (data && cloudUser && !isLoading && !isAuthLoading) {
      persistData(data);
    }
  }, [cloudUser, data, isAuthLoading, isLoading, persistData]);

  // --- 事件處理函式 ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleCloudLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const handleAddRecord = (record: Omit<ScoreRecord, 'id' | 'timestamp'>): ScoreRecord | null => {
    if (!data) return null;
    const timestamp = Date.now();
    const newRecord: ScoreRecord = {
      ...record,
      id: timestamp.toString(),
      timestamp,
    };
    setData((prev) => {
      if (!prev) return prev;
      const recordCreator = prev.users.find((user) => user.id === newRecord.createdById);
      const shouldCountForGarden = newRecord.pointsChange > 0 && recordCreator?.role === UserRole.PARENT;

      return {
        ...prev,
        records: [...prev.records, newRecord],
        familyGarden: shouldCountForGarden
          ? addGardenPositivePoints(prev.familyGarden, newRecord.childId, newRecord.pointsChange)
          : prev.familyGarden,
      };
    });
    return newRecord;
  };

  const handleUpdateItems = (items: ScoreItem[]) => {
    setData((prev) => (prev ? { ...prev, scoreItems: items } : prev));
  };

  const handleUpdateRewardItems = (items: RewardItem[]) => {
    setData((prev) => (prev ? { ...prev, rewardItems: items } : prev));
  };

  const handleWaterGarden = (childId: string) => {
    if (!currentUser || currentUser.role !== UserRole.CHILD || currentUser.id !== childId) return;
    const timestamp = Date.now();

    setData((prev) => {
      if (!prev) return prev;
      const result = waterFamilyGarden(prev.familyGarden, currentUser, timestamp.toString(), timestamp);
      return result.didWater ? { ...prev, familyGarden: result.garden } : prev;
    });
  };

  const handleStartGardenPlant = (speciesId: string) => {
    if (!currentUser) return;
    const timestamp = Date.now();

    setData((prev) => prev ? {
      ...prev,
      familyGarden: startFamilyGardenPlant(
        prev.familyGarden,
        speciesId,
        timestamp.toString(),
        timestamp,
      ),
    } : prev);
  };

  const handleUpdateGoalRewards = (updater: (items: GoalReward[]) => GoalReward[]) => {
    setData((prev) => (prev ? { ...prev, goalRewards: updater(prev.goalRewards) } : prev));
  };

  const handleUpdateDiscountCards = (updater: (items: DiscountCard[]) => DiscountCard[]) => {
    setData((prev) => (prev ? { ...prev, discountCards: updater(prev.discountCards) } : prev));
  };

  const handleUpdateRewardCards = (updater: (items: RewardCard[]) => RewardCard[]) => {
    setData((prev) => (prev ? { ...prev, rewardCards: updater(prev.rewardCards) } : prev));
  };

  const handleUpdateStampCards = (updater: (items: StampCard[]) => StampCard[]) => {
    setData((prev) => (prev ? { ...prev, stampCards: updater(prev.stampCards) } : prev));
  };

  const handleSendMessage = (msg: Omit<SecretMessage, 'id' | 'timestamp' | 'isRead'>) => {
    const newMessage: SecretMessage = {
      ...msg,
      id: Date.now().toString(),
      timestamp: Date.now(),
      isRead: false
    };
    setData((prev) => (prev ? {
      ...prev,
      messages: [...prev.messages, newMessage]
    } : prev));
  };

  const handleMarkMessageRead = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const updatedMessages = prev.messages.map(m => 
        m.id === id ? { ...m, isRead: true } : m
      );
      return { ...prev, messages: updatedMessages };
    });
  };

  // --- 渲染邏輯 ---

  // 開發預覽模式：?preview=child / ?preview=parent，跳過 Firebase 登入用假資料預覽。
  // 僅在開發環境生效，正式 build 會被移除。
  if (import.meta.env.DEV) {
    const previewRole = new URLSearchParams(window.location.search).get('preview');
    if (previewRole) {
      return <PreviewHarness role={previewRole} />;
    }
  }

  if (firebaseConfigError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center app-bg text-nook-brown p-6 text-center">
        <div className="text-3xl mb-3">🛠️</div>
        <p className="text-lg font-black mb-2">Firebase 尚未設定完成</p>
        <p className="max-w-xl text-sm font-bold text-nook-brown/70 leading-relaxed">
          {firebaseConfigError}
          <br />
          請先建立 `.env.local` 並填入 Firebase Web App 設定值。
        </p>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center app-bg text-nook-brown">
        <div className="text-3xl mb-2">🌱</div>
        <p className="text-sm font-bold">確認雲端登入狀態中...</p>
      </div>
    );
  }

  if (!cloudUser) {
    return <CloudLogin />;
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center app-bg text-nook-brown">
        <div className="text-3xl mb-2">🍃</div>
        <p className="text-sm font-bold">載入中...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center app-bg text-nook-brown">
        <div className="text-3xl mb-2">😢</div>
        <p className="text-base font-bold text-nook-red">{error || '發生未知錯誤'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-nook-green text-white rounded-xl font-bold hover:brightness-105"
        >
          重新整理
        </button>
      </div>
    );
  }

  // 若未登入角色，顯示角色選擇頁面
  if (!currentUser) {
    return (
      <>
        <RoleSelector
          users={data.users}
          onSelectUser={handleLogin}
          cloudEmail={cloudUser.email || '已登入雲端帳號'}
          onCloudLogout={handleCloudLogout}
        />
        {saveWarning && <SaveWarningToast message={saveWarning} />}
      </>
    );
  }

  // 若已登入角色，顯示儀表板
  return (
    <>
      <Dashboard 
        currentUser={currentUser}
        data={data}
        onLogout={handleLogout}
        onAddRecord={handleAddRecord}
        onUpdateItems={handleUpdateItems}
        onSendMessage={handleSendMessage}
        onMarkMessageRead={handleMarkMessageRead}
        onUpdateRewardItems={handleUpdateRewardItems}
        onUpdateGoalRewards={handleUpdateGoalRewards}
        onUpdateDiscountCards={handleUpdateDiscountCards}
        onUpdateRewardCards={handleUpdateRewardCards}
        onUpdateStampCards={handleUpdateStampCards}
        onWaterGarden={handleWaterGarden}
        onStartGardenPlant={handleStartGardenPlant}
        cloudEmail={cloudUser.email || '已登入雲端帳號'}
        onCloudLogout={handleCloudLogout}
      />
      {saveWarning && <SaveWarningToast message={saveWarning} />}
    </>
  );
};

// --- 儲存警告 Toast 元件 ---
const SaveWarningToast: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 animate-pop">
    <div className="bg-nook-orange text-white px-4 py-2 rounded-xl soft-card text-sm font-bold flex items-center gap-2">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  </div>
);

export default App;
