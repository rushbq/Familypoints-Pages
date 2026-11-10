import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  commitStateMutation,
  isRetryableSaveError,
  StateMutation,
  subscribeState,
} from './services/storageService';
import {
  AppState,
  BeyBossAttempt,
  DiscountCard,
  GoalReward,
  GoalRewardStatus,
  RewardCard,
  RewardItem,
  ScoreItem,
  ScoreRecord,
  SecretMessage,
  StampCard,
  StampCardStatus,
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
import {
  addBeyScrap,
  assembleBey,
  drawBeyPart,
  grantBeyPart,
  removeBeyBuild,
} from './services/beyUtils';
import {
  awardBossRewards,
  challengeBoss,
  getWeekKey,
  setLineup,
} from './services/beyBossUtils';

/** 一筆還沒被雲端確認的操作。 */
interface PendingOp {
  id: string;
  mutate: StateMutation;
  /** 交易已經成功，只是還在等快照回來確認。 */
  committed: boolean;
}

const SYNC_RETRY_MS = 5000;

const createOpId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * 先把亂數抽好，回傳一個「每次呼叫都從頭重播同一串亂數」的產生器。
 * 操作在等雲端確認時會被重套好幾次，每次都必須抽出同一個零件、同一場勝負。
 */
const preRollRandom = (count = 8): (() => () => number) => {
  const rolls = Array.from({ length: count }, () => Math.random());
  return () => {
    let index = 0;
    return () => rolls[index++ % count];
  };
};

/** 離線或連線不穩時，等網路恢復或過幾秒再試。 */
const waitForRetry = () => new Promise<void>((resolve) => {
  const done = () => {
    window.clearTimeout(timer);
    window.removeEventListener('online', done);
    resolve();
  };
  const timer = window.setTimeout(done, SYNC_RETRY_MS);
  window.addEventListener('online', done);
});

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
  // 儲存警告（離線或寫入失敗時顯示）
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const saveWarningTimerRef = useRef<number | undefined>(undefined);
  // 雲端最後一次快照的狀態；畫面上的 data = 它 + 還沒確認的操作
  const serverStateRef = useRef<AppState | null>(null);
  const pendingOpsRef = useRef<PendingOp[]>([]);
  // 和 data 同一份，但同步更新：連點兩下時第二下要看得到第一下的結果
  const latestDataRef = useRef<AppState | null>(null);
  const isFlushingRef = useRef(false);

  const showSaveWarning = useCallback((message: string) => {
    window.clearTimeout(saveWarningTimerRef.current);
    setSaveWarning(message);
    saveWarningTimerRef.current = window.setTimeout(() => setSaveWarning(null), 5000);
  }, []);

  /** 用雲端狀態重新套上所有還沒確認的操作，得到畫面上該顯示的狀態。 */
  const rebuildData = useCallback(() => {
    const base = serverStateRef.current;
    const next = base ? pendingOpsRef.current.reduce((state, op) => op.mutate(state), base) : null;
    latestDataRef.current = next;
    setData(next);
  }, []);

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
    serverStateRef.current = null;
    pendingOpsRef.current = [];
    if (!cloudUser) {
      rebuildData();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeState(
      (loadedData, appliedOps) => {
        serverStateRef.current = loadedData;
        // 已經寫進雲端的操作不用再自己套一次，否則會重複（例如同一筆加分出現兩次）
        pendingOpsRef.current = pendingOpsRef.current.filter((op) => !appliedOps.includes(op.id));
        rebuildData();
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
  }, [cloudUser, rebuildData]);

  /** 依序把還沒寫進雲端的操作用交易送出；離線時排隊等連線恢復。 */
  const flushPendingOps = useCallback(async () => {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;
    try {
      let op = pendingOpsRef.current.find((item) => !item.committed);
      while (op) {
        try {
          await commitStateMutation(op.id, op.mutate);
          op.committed = true;
        } catch (err) {
          if (isRetryableSaveError(err)) {
            showSaveWarning('⚠️ 目前離線，恢復連線後會自動同步，先別關掉 App');
            await waitForRetry();
            op = pendingOpsRef.current.find((item) => !item.committed);
            continue;
          }
          // 權限或資料本身的問題，重試也不會好：放棄這筆，畫面退回雲端的狀態
          const failed = op;
          console.error('❌ 儲存雲端狀態失敗:', err);
          showSaveWarning(`⚠️ 儲存失敗：${err instanceof Error ? err.message : '未知錯誤'}`);
          pendingOpsRef.current = pendingOpsRef.current.filter((item) => item !== failed);
          rebuildData();
        }
        op = pendingOpsRef.current.find((item) => !item.committed);
      }
    } finally {
      isFlushingRef.current = false;
    }
  }, [rebuildData, showSaveWarning]);

  /** 所有狀態修改的唯一入口：先更新畫面，再在背景寫進雲端。 */
  const applyMutation = (mutate: StateMutation) => {
    if (!serverStateRef.current) return;
    pendingOpsRef.current = [...pendingOpsRef.current, { id: createOpId(), mutate, committed: false }];
    rebuildData();
    void flushPendingOps();
  };

  // 還有沒寫進雲端的操作時，關掉分頁前先提醒
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pendingOpsRef.current.some((op) => !op.committed)) event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

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
    if (!latestDataRef.current) return null;
    const timestamp = Date.now();
    const newRecord: ScoreRecord = {
      ...record,
      id: timestamp.toString(),
      timestamp,
    };
    applyMutation((prev) => {
      const recordCreator = prev.users.find((user) => user.id === newRecord.createdById);
      const shouldCountForGarden = newRecord.pointsChange > 0 && recordCreator?.role === UserRole.PARENT;

      // 花園的陽光與陀螺的鋼料各走各的，同一筆加分兩邊都前進，不互相消耗。
      return {
        ...prev,
        records: [...prev.records, newRecord],
        familyGarden: shouldCountForGarden
          ? addGardenPositivePoints(prev.familyGarden, newRecord.childId, newRecord.pointsChange)
          : prev.familyGarden,
        beyForge: shouldCountForGarden
          ? addBeyScrap(prev.beyForge, newRecord.childId, newRecord.pointsChange)
          : prev.beyForge,
      };
    });
    return newRecord;
  };

  const handleUpdateItems = (items: ScoreItem[]) => {
    applyMutation((prev) => ({ ...prev, scoreItems: items }));
  };

  const handleUpdateRewardItems = (items: RewardItem[]) => {
    applyMutation((prev) => ({ ...prev, rewardItems: items }));
  };

  const handleWaterGarden = (childId: string) => {
    if (!currentUser || currentUser.role !== UserRole.CHILD || currentUser.id !== childId) return;
    const child = currentUser;
    const timestamp = Date.now();

    applyMutation((prev) => {
      const result = waterFamilyGarden(prev.familyGarden, child, timestamp.toString(), timestamp);
      return result.didWater ? { ...prev, familyGarden: result.garden } : prev;
    });
  };

  const handleStartGardenPlant = (speciesId: string) => {
    if (!currentUser) return;
    const timestamp = Date.now();

    applyMutation((prev) => ({
      ...prev,
      familyGarden: startFamilyGardenPlant(
        prev.familyGarden,
        speciesId,
        timestamp.toString(),
        timestamp,
      ),
    }));
  };

  /**
   * 孩子按下鍛造，抽一個普通零件。
   * 回傳結果讓畫面顯示抽到什麼；重複零件會退鋼料而不入庫。
   * 結果在 setState 外面先算好：放在 updater 裡的話，React 不一定會立刻執行它，
   * 畫面就拿不到結果，鍛造次數卻已經扣掉了。
   */
  const handleDrawBeyPart = (childId: string) => {
    const current = latestDataRef.current;
    if (!current) return { partId: null, isDuplicate: false };
    const timestamp = Date.now();
    const random = preRollRandom(1);
    const draw = (forge: AppState['beyForge']) => drawBeyPart(forge, childId, timestamp.toString(), timestamp, random());

    const result = draw(current.beyForge);
    if (!result.partId) return { partId: null, isDuplicate: false };

    applyMutation((prev) => {
      const next = draw(prev.beyForge);
      return next.partId ? { ...prev, beyForge: next.forge } : prev;
    });
    return { partId: result.partId, isDuplicate: result.isDuplicate };
  };

  const handleAssembleBey = (
    childId: string,
    name: string,
    bladeId: string,
    ratchetId: string,
    bitId: string,
  ) => {
    const timestamp = Date.now();
    applyMutation((prev) => ({
      ...prev,
      beyForge: assembleBey(prev.beyForge, childId, name, bladeId, ratchetId, bitId, timestamp.toString(), timestamp),
    }));
  };

  const handleDisassembleBey = (buildId: string) => {
    applyMutation((prev) => ({ ...prev, beyForge: removeBeyBuild(prev.beyForge, buildId) }));
  };

  /** 孩子為本週魔王派出（或收回）一顆陀螺。 */
  const handleSetBossLineup = (childId: string, buildId: string | null) => {
    if (!currentUser || currentUser.role !== UserRole.CHILD || currentUser.id !== childId) return;
    const weekKey = getWeekKey();
    applyMutation((prev) => ({
      ...prev,
      beyBoss: setLineup(prev.beyBoss, weekKey, childId, buildId),
    }));
  };

  /**
   * 挑戰本週魔王。回傳這次的三回合結果讓畫面揭曉；
   * 打贏完整版時出戰的兩個孩子各拿一個專屬零件，打贏減弱版則只有出戰的那個孩子拿一個一般稀有零件。
   * 和鍛造一樣，結果在 setState 外面先算好，亂數也先抽好，重套時才會是同一場。
   */
  const handleChallengeBoss = () => {
    const current = latestDataRef.current;
    if (!current || !currentUser || currentUser.role !== UserRole.CHILD) return null;
    const timestamp = Date.now();
    const now = new Date(timestamp);
    const weekKey = getWeekKey(now);
    const random = preRollRandom();
    const challenge = (state: AppState) => {
      const rolls = random();
      const result = challengeBoss(state.beyBoss, state.beyForge, weekKey, timestamp.toString(), timestamp, rolls, now);
      return { result, beyForge: awardBossRewards(state.beyForge, result, timestamp, rolls) };
    };

    const { result } = challenge(current);
    if (!result.attempt) return null;

    applyMutation((prev) => {
      const next = challenge(prev);
      return next.result.attempt ? { ...prev, beyBoss: next.result.state, beyForge: next.beyForge } : prev;
    });
    return result.attempt;
  };

  /**
   * 目標被標記為達成時掉一個稀有零件。
   * 用前後比對偵測，SettingsPanel 不需要知道鍛造系統的存在。
   */
  const handleUpdateGoalRewards = (updater: (items: GoalReward[]) => GoalReward[]) => {
    const timestamp = Date.now();
    const random = preRollRandom();
    applyMutation((prev) => {
      const goalRewards = updater(prev.goalRewards);
      const before = new Map(prev.goalRewards.map((goal) => [goal.id, goal.status]));
      const achieved = goalRewards.filter((goal) => (
        goal.status === GoalRewardStatus.ACHIEVED && before.get(goal.id) !== GoalRewardStatus.ACHIEVED
      ));

      const rolls = random();
      let beyForge = prev.beyForge;
      achieved.forEach((goal, index) => {
        beyForge = grantBeyPart(beyForge, goal.childId, 'GOAL', `${timestamp}_${index}`, timestamp, rolls).forge;
      });

      return { ...prev, goalRewards, beyForge };
    });
  };

  const handleUpdateDiscountCards = (updater: (items: DiscountCard[]) => DiscountCard[]) => {
    applyMutation((prev) => ({ ...prev, discountCards: updater(prev.discountCards) }));
  };

  /** 家長新發出獎勵卡時掉一個稀有零件。 */
  const handleUpdateRewardCards = (updater: (items: RewardCard[]) => RewardCard[]) => {
    const timestamp = Date.now();
    const random = preRollRandom();
    applyMutation((prev) => {
      const rewardCards = updater(prev.rewardCards);
      const existing = new Set(prev.rewardCards.map((card) => card.id));
      const issued = rewardCards.filter((card) => !existing.has(card.id));

      const rolls = random();
      let beyForge = prev.beyForge;
      issued.forEach((card, index) => {
        beyForge = grantBeyPart(beyForge, card.childId, 'REWARD_CARD', `${timestamp}_rc${index}`, timestamp, rolls).forge;
      });

      return { ...prev, rewardCards, beyForge };
    });
  };

  /** 集點卡兌換（集滿）時掉一個稀有零件。 */
  const handleUpdateStampCards = (updater: (items: StampCard[]) => StampCard[]) => {
    const timestamp = Date.now();
    const random = preRollRandom();
    applyMutation((prev) => {
      const stampCards = updater(prev.stampCards);
      const before = new Map(prev.stampCards.map((card) => [card.id, card.status]));
      const redeemed = stampCards.filter((card) => (
        card.status === StampCardStatus.REDEEMED && before.get(card.id) !== StampCardStatus.REDEEMED
      ));

      const rolls = random();
      let beyForge = prev.beyForge;
      redeemed.forEach((card, index) => {
        beyForge = grantBeyPart(beyForge, card.childId, 'STAMP', `${timestamp}_sc${index}`, timestamp, rolls).forge;
      });

      return { ...prev, stampCards, beyForge };
    });
  };

  const handleSendMessage = (msg: Omit<SecretMessage, 'id' | 'timestamp' | 'isRead'>) => {
    const newMessage: SecretMessage = {
      ...msg,
      id: Date.now().toString(),
      timestamp: Date.now(),
      isRead: false
    };
    applyMutation((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  };

  const handleMarkMessageRead = (id: string) => {
    applyMutation((prev) => {
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
      <div className="h-screen flex flex-col items-center justify-center app-bg text-bey-ink p-6 text-center">
        <div className="text-3xl mb-3">🛠️</div>
        <p className="text-lg font-black mb-2">Firebase 尚未設定完成</p>
        <p className="max-w-xl text-sm font-normal text-bey-dim leading-relaxed">
          {firebaseConfigError}
          <br />
          請先建立 `.env.local` 並填入 Firebase Web App 設定值。
        </p>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center app-bg text-bey-ink">
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
      <div className="h-screen flex flex-col items-center justify-center app-bg text-bey-ink">
        <div className="text-3xl mb-2">🍃</div>
        <p className="text-sm font-bold">載入中...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center app-bg text-bey-ink">
        <div className="text-3xl mb-2">😢</div>
        <p className="text-base font-bold text-bey-red">{error || '發生未知錯誤'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-bey-cyan text-bey-void rounded-xl font-bold hover:brightness-105"
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
        onDrawBeyPart={handleDrawBeyPart}
        onAssembleBey={handleAssembleBey}
        onDisassembleBey={handleDisassembleBey}
        onSetBossLineup={handleSetBossLineup}
        onChallengeBoss={handleChallengeBoss}
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
    <div className="bg-bey-red text-bey-void px-4 py-2 rounded-xl soft-card text-sm font-bold flex items-center gap-2">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  </div>
);

export default App;
