import React, { useState, useEffect, useCallback } from 'react';
import { loadState, saveState, SaveResult } from './services/storageService';
import { AppState, ScoreItem, ScoreRecord, SecretMessage, User, RewardItem } from './types';
import { RoleSelector } from './components/RoleSelector';
import { Dashboard } from './components/Dashboard';

/**
 * 應用程式主元件
 * 負責全域狀態管理 (State Management) 與資料持久化 (Persistence)
 * 使用 IndexedDB (透過 Dexie.js) 進行資料儲存
 */
const App: React.FC = () => {
  // 全域狀態
  const [data, setData] = useState<AppState | null>(null);
  // 目前登入的使用者
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // 載入狀態
  const [isLoading, setIsLoading] = useState(true);
  // 錯誤狀態
  const [error, setError] = useState<string | null>(null);
  // 儲存警告（空間不足時顯示）
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  // 初始化：元件掛載時從 IndexedDB 載入資料
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        const loadedData = await loadState();
        setData(loadedData);
        setError(null);
      } catch (err) {
        console.error('載入資料失敗:', err);
        setError('載入資料失敗，請重新整理頁面');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // 儲存資料的函式（使用 useCallback 避免不必要的重新渲染）
  const persistData = useCallback(async (newData: AppState) => {
    const result: SaveResult = await saveState(newData);
    
    if (!result.success) {
      setSaveWarning(`⚠️ 儲存失敗: ${result.error}`);
      // 3 秒後清除警告
      setTimeout(() => setSaveWarning(null), 5000);
    } else if (result.storageWarning) {
      setSaveWarning('⚠️ 儲存空間即將用完，建議備份資料後清理舊紀錄');
      setTimeout(() => setSaveWarning(null), 5000);
    }
  }, []);

  // 監聽資料變更：當 data 改變時，自動寫入 IndexedDB
  useEffect(() => {
    if (data && !isLoading) {
      persistData(data);
    }
  }, [data, isLoading, persistData]);

  // --- 事件處理函式 ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // 新增歷史紀錄 (加分/扣分/兌換)
  const handleAddRecord = (record: Omit<ScoreRecord, 'id' | 'timestamp'>) => {
    if (!data) return;
    const newRecord: ScoreRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setData({
      ...data,
      records: [...data.records, newRecord]
    });
  };

  // 更新評分項目列表 (Settings)
  const handleUpdateItems = (items: ScoreItem[]) => {
    if (!data) return;
    setData({ ...data, scoreItems: items });
  };

  // 更新獎勵項目列表 (Settings)
  const handleUpdateRewardItems = (items: RewardItem[]) => {
    if (!data) return;
    setData({ ...data, rewardItems: items });
  };

  // 更新使用者資料 (Settings)
  const handleUpdateUsers = (users: User[]) => {
    if (!data) return;
    setData({ ...data, users: users });
  }

  // 匯入備份資料 (Settings)
  const handleImportData = (newData: AppState) => {
    setData(newData);
  }

  // 發送悄悄話
  const handleSendMessage = (msg: Omit<SecretMessage, 'id' | 'timestamp' | 'isRead'>) => {
    if (!data) return;
    const newMessage: SecretMessage = {
      ...msg,
      id: Date.now().toString(),
      timestamp: Date.now(),
      isRead: false
    };
    setData({
      ...data,
      messages: [...data.messages, newMessage]
    });
  };

  // 標記訊息為已讀
  const handleMarkMessageRead = (id: string) => {
    if (!data) return;
    const updatedMessages = data.messages.map(m => 
      m.id === id ? { ...m, isRead: true } : m
    );
    setData({ ...data, messages: updatedMessages });
  };

  // --- 渲染邏輯 ---

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#CDF5E2] text-nook-brown">
        <div className="text-6xl mb-4 animate-bounce">🍃</div>
        <p className="text-xl font-bold">載入中...</p>
      </div>
    );
  }

  // 錯誤狀態
  if (error || !data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#CDF5E2] text-nook-brown">
        <div className="text-6xl mb-4">😢</div>
        <p className="text-xl font-bold text-red-500">{error || '發生未知錯誤'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-nook-green text-white rounded-full font-bold hover:brightness-110"
        >
          重新整理
        </button>
      </div>
    );
  }

  // 若未登入，顯示角色選擇頁面
  if (!currentUser) {
    return (
      <>
        <RoleSelector users={data.users} onSelectUser={handleLogin} />
        {/* 儲存警告 Toast */}
        {saveWarning && <SaveWarningToast message={saveWarning} />}
      </>
    );
  }

  // 若已登入，顯示儀表板
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
        onUpdateUsers={handleUpdateUsers}
        onImportData={handleImportData}
        onUpdateRewardItems={handleUpdateRewardItems}
      />
      {/* 儲存警告 Toast */}
      {saveWarning && <SaveWarningToast message={saveWarning} />}
    </>
  );
};

// --- 儲存警告 Toast 元件 ---
const SaveWarningToast: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-pop">
    <div className="bg-yellow-500 text-white px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-2">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  </div>
);

export default App;