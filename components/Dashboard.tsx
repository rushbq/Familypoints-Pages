import React, { useState } from 'react';
import { User, UserRole, AppState, ScoreItem, ScoreRecord, SecretMessage } from '../types';
import { Button } from './ui/Button';
import { Icons } from './Icons';
import { calculateScore } from '../services/storageService';
import { Card } from './ui/Card';
import { RechartsWrapper } from './RechartsWrapper';

// Sub-components
import { HistoryLog } from './HistoryLog';
import { ActionLogger } from './ActionLogger';
import { SettingsPanel } from './SettingsPanel';
import { RewardRedeemer } from './RewardRedeemer'; // Import 新增的獎勵兌換組件

interface DashboardProps {
  currentUser: User;
  data: AppState;
  onLogout: () => void;
  onAddRecord: (record: Omit<ScoreRecord, 'id' | 'timestamp'>) => void;
  onUpdateItems: (items: ScoreItem[]) => void;
  onSendMessage: (msg: Omit<SecretMessage, 'id' | 'timestamp' | 'isRead'>) => void;
  onMarkMessageRead: (id: string) => void;
  onUpdateUsers: (users: User[]) => void;
  onImportData: (state: AppState) => void;
  // onUpdateRewardItems 將在 SettingsPanel 使用，這裡需要傳遞更新 AppState 的邏輯，目前透過 prop drilling 處理比較簡單
  onUpdateRewardItems: (items: any[]) => void; 
}

type Tab = 'overview' | 'log' | 'settings';

export const Dashboard: React.FC<DashboardProps> = ({ 
  currentUser, 
  data, 
  onLogout, 
  onAddRecord, 
  onUpdateItems,
  onSendMessage,
  onMarkMessageRead,
  onUpdateUsers,
  onImportData,
  onUpdateRewardItems
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const isParent = currentUser.role === UserRole.PARENT;

  // --- 計算即時分數 ---
  const child1 = data.users.find(u => u.id === 'child_1')!;
  const child2 = data.users.find(u => u.id === 'child_2')!;
  const score1 = calculateScore(child1.id, data.records);
  const score2 = calculateScore(child2.id, data.records);

  // --- 狀態：日期篩選器 (預設 7 天) ---
  const [daysFilter, setDaysFilter] = useState(7);

  // --- 狀態：控制 ActionLogger (加扣分) 視窗 ---
  const [loggingAction, setIsLoggingAction] = useState<{childId: string, type: 'POSITIVE' | 'NEGATIVE'} | null>(null);

  // --- 狀態：控制 RewardRedeemer (兌換獎勵) 視窗 (New) ---
  const [redeemingReward, setIsRedeemingReward] = useState<{childId: string} | null>(null);

  /**
   * 渲染主要內容區域
   */
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8 animate-pop">
            {/* 歡迎標題區塊 */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-nook-brown">
                        {new Date().getHours() < 12 ? '早安！' : '你好！'} 
                        <span className="text-nook-greenDark ml-2">{currentUser.name}</span>
                    </h2>
                    <p className="text-nook-brown/60 font-bold mt-1">今天也要為了家庭和睦努力喔！</p>
                </div>
                <div className="bg-nook-yellow/40 px-6 py-2 rounded-full border-2 border-white shadow-sm">
                    <span className="font-bold text-nook-orangeDark text-lg">📅 {new Date().toLocaleDateString('zh-TW')}</span>
                </div>
            </div>

            {/* 成員積分卡片區塊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ScoreCard 
                user={child1} 
                score={score1} 
                onAddPoints={() => isParent && setIsLoggingAction({ childId: child1.id, type: 'POSITIVE' })}
                onDeductPoints={() => isParent && setIsLoggingAction({ childId: child1.id, type: 'NEGATIVE' })}
                onRedeem={() => setIsRedeemingReward({ childId: child1.id })}
                canManageScoreActions={isParent}
                colorTheme="blue"
              />
              <ScoreCard 
                user={child2} 
                score={score2} 
                onAddPoints={() => isParent && setIsLoggingAction({ childId: child2.id, type: 'POSITIVE' })}
                onDeductPoints={() => isParent && setIsLoggingAction({ childId: child2.id, type: 'NEGATIVE' })}
                onRedeem={() => setIsRedeemingReward({ childId: child2.id })}
                canManageScoreActions={isParent}
                colorTheme="green"
              />
            </div>

             {/* 圖表區塊 (僅家長可見) */}
             {isParent && (
                <Card className="mt-6 border-4 border-white bg-white/60">
                    <div className="flex items-center mb-4 gap-2">
                        <div className="p-2 bg-nook-green rounded-lg text-white"><Icons.BarChart2 size={20} /></div>
                        <h3 className="text-xl font-bold text-nook-brown">近期積分趨勢</h3>
                    </div>
                    <div className="h-64">
                       <RechartsWrapper data={data.records} users={data.users} />
                    </div>
                </Card>
             )}
          </div>
        );
      case 'log':
        // 日誌篩選邏輯
        const cutoffTime = Date.now() - (daysFilter * 24 * 60 * 60 * 1000);
        const filteredRecords = data.records.filter(r => r.timestamp >= cutoffTime);

        return (
           <Card variant="paper" className="min-h-[600px] bg-white">
             <div className="flex flex-col md:flex-row items-center justify-between mb-6 border-b-2 border-nook-brown/10 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <Icons.BookOpen className="text-nook-brown" size={32} />
                  <h2 className="text-2xl font-black text-nook-brown">活動日誌</h2>
                </div>
                
                {/* 顯示範圍選擇器 */}
                <div className="flex items-center gap-2 bg-nook-beige p-2 rounded-2xl">
                   <span className="text-sm font-bold text-nook-brown pl-2">顯示：</span>
                   <select 
                     value={daysFilter} 
                     onChange={(e) => setDaysFilter(Number(e.target.value))}
                     className="bg-white border-2 border-nook-brown/10 text-nook-brown font-bold text-sm rounded-xl py-2 px-3 outline-none focus:border-nook-green"
                   >
                     <option value={7}>最近 7 天</option>
                     <option value={14}>最近 14 天</option>
                     <option value={30}>最近 30 天</option>
                     <option value={9999}>全部紀錄</option>
                   </select>
                </div>
             </div>
             
             <div className="overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
                <HistoryLog records={filteredRecords} showAll={true} />
             </div>
           </Card>
        );
      case 'settings':
        return isParent ? (
          <SettingsPanel 
            appData={data}
            onUpdateItems={onUpdateItems} 
            onUpdateUsers={onUpdateUsers}
            onImportData={onImportData}
            onUpdateRewardItems={onUpdateRewardItems} // 傳遞更新獎勵的函式
          />
        ) : <div className="p-20 text-center font-bold text-nook-brown/50 text-xl">🚧 施工中，閒人勿進！ 🚧</div>;
      default:
        return null;
    }
  };

  /**
   * 處理加/扣分提交
   */
  const handleActionSubmit = (itemId: string, note?: string) => {
    if (!isParent || !loggingAction) return;
    const item = data.scoreItems.find(i => i.id === itemId);
    if (!item) return;

    const child = data.users.find(u => u.id === loggingAction.childId);
    
    onAddRecord({
      childId: loggingAction.childId,
      childName: child?.name || 'Unknown',
      itemId: item.id,
      itemName: item.label,
      pointsChange: item.type === 'POSITIVE' ? item.points : -item.points,
      note,
      createdById: currentUser.id,
      createdByName: currentUser.name
    });
    setIsLoggingAction(null);
  };

  /**
   * 處理獎勵兌換提交
   * 邏輯：建立一筆負分的紀錄
   */
  const handleRedeemSubmit = (itemId: string) => {
    if (!redeemingReward) return;
    const reward = data.rewardItems.find(r => r.id === itemId);
    if (!reward) return;

    const child = data.users.find(u => u.id === redeemingReward.childId);

    onAddRecord({
        childId: redeemingReward.childId,
        childName: child?.name || 'Unknown',
        itemId: reward.id,
        itemName: `兌換：${reward.label}`, // 標記為兌換
        pointsChange: -reward.points, // 扣除分數
        note: '獎勵兌換',
        createdById: currentUser.id,
        createdByName: currentUser.name
    });
    setIsRedeemingReward(null);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#CDF5E2]">
      {/* 側邊導覽列 (NookPhone 風格) */}
      <aside className="w-20 md:w-24 lg:w-80 bg-nook-cream border-r-8 border-white flex flex-col flex-shrink-0 z-20 shadow-xl relative">
        <div className="h-6 w-24 bg-nook-beige absolute top-2 left-1/2 -translate-x-1/2 rounded-full hidden lg:block"></div>

        <div className="p-4 lg:p-8 mt-4 flex items-center justify-center lg:justify-start">
           <div className="w-12 h-12 lg:w-14 lg:h-14 bg-nook-green text-white rounded-[1.5rem] flex items-center justify-center shadow-[0_4px_0_0_#5EBA9A] border-2 border-white transform -rotate-6">
             <Icons.Leaf size={32} />
           </div>
           <div className="hidden lg:block ml-4">
             <h1 className="font-black text-2xl text-nook-brown leading-none">Home</h1>
             <span className="text-nook-brown/60 font-bold text-sm tracking-widest">SYSTEM</span>
           </div>
        </div>
        
        <nav className="flex-1 px-2 md:px-4 py-2 space-y-4 overflow-y-auto no-scrollbar">
          <NavItem 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
            icon={<Icons.Home size={28} />} 
            label="首頁" 
            bgColor="bg-nook-orange"
          />
          <NavItem 
            active={activeTab === 'log'} 
            onClick={() => setActiveTab('log')} 
            icon={<Icons.ClipboardList size={28} />} 
            label="日誌" 
            bgColor="bg-nook-blue"
          />
          {isParent && (
            <NavItem 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
              icon={<Icons.Settings size={28} />} 
              label="設定" 
              bgColor="bg-nook-brown"
            />
          )}
        </nav>

        <div className="p-4 lg:p-6 mt-auto">
           {/* 使用者簡介卡片 */}
           <div className="bg-nook-yellow/20 p-4 rounded-[2rem] border-2 border-white mb-4 hidden lg:flex items-center shadow-sm">
               <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl border-2 border-nook-brown/10 mr-3">
                 {currentUser.avatar}
               </div>
               <div className="overflow-hidden">
                 <p className="text-sm font-black text-nook-brown truncate">{currentUser.name}</p>
                 <p className="text-xs text-nook-brown/60 font-bold">{currentUser.role === UserRole.PARENT ? '管理員' : '成員'}</p>
               </div>
           </div>

          <button 
            onClick={onLogout}
            className="w-full group flex items-center justify-center lg:justify-start p-3 rounded-2xl text-nook-brown/40 hover:text-nook-red hover:bg-nook-red/10 transition-colors font-bold"
          >
            <Icons.LogOut size={24} className="lg:mr-2" />
            <span className="hidden lg:inline">離開 (登出)</span>
          </button>
        </div>
      </aside>

      {/* 主要內容區域 */}
      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        {/* 手機版頂部導覽 */}
        <header className="sticky top-0 bg-nook-cream/90 backdrop-blur-md z-10 px-6 py-4 flex justify-between items-center md:hidden border-b-4 border-white shadow-sm">
            <div className="flex items-center gap-2">
              <Icons.Leaf className="text-nook-green" />
              <h1 className="text-xl font-black text-nook-brown">Family Points</h1>
            </div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-nook-brown/10">{currentUser.avatar}</div>
        </header>

        <div className="p-6 md:p-12 max-w-6xl mx-auto pb-32">
          {renderContent()}
        </div>
      </main>

      {/* 加扣分操作視窗 (Modal) */}
      {isParent && loggingAction && (
        <ActionLogger 
          isOpen={true}
          onClose={() => setIsLoggingAction(null)}
          onSubmit={handleActionSubmit}
          items={data.scoreItems}
          type={loggingAction.type}
          targetChildName={data.users.find(u => u.id === loggingAction.childId)?.name || ''}
        />
      )}

      {/* 獎勵兌換視窗 (Modal) */}
      {redeemingReward && (
          <RewardRedeemer 
            isOpen={true}
            onClose={() => setIsRedeemingReward(null)}
            onSubmit={handleRedeemSubmit}
            items={data.rewardItems}
            currentScore={redeemingReward.childId === 'child_1' ? score1 : score2}
            targetChildName={data.users.find(u => u.id === redeemingReward.childId)?.name || ''}
          />
      )}
    </div>
  );
};

// --- 側邊欄按鈕元件 ---
const NavItem = ({ active, onClick, icon, label, bgColor, badge = 0 }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, bgColor: string, badge?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-[2rem] transition-all duration-200 group relative ${
      active 
        ? 'bg-white shadow-md transform scale-105' 
        : 'hover:bg-white/50 hover:scale-105'
    }`}
  >
    <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-[1.2rem] flex items-center justify-center text-white shadow-sm transition-transform group-hover:rotate-6 ${bgColor}`}>
      {icon}
    </div>
    <span className={`ml-4 font-black text-lg hidden lg:block ${active ? 'text-nook-brown' : 'text-nook-brown/60'}`}>{label}</span>
    
    {badge > 0 && (
        <div className="absolute top-0 right-0 lg:top-4 lg:right-4 w-6 h-6 bg-nook-red border-2 border-white rounded-full text-white text-xs font-bold flex items-center justify-center animate-bounce">
            {badge}
        </div>
    )}
  </button>
);

// --- 積分卡片元件 (包含操作按鈕) ---
const ScoreCard = ({ user, score, onAddPoints, onDeductPoints, onRedeem, canManageScoreActions, colorTheme }: { 
  user: User, 
  score: number, 
  onAddPoints: () => void,
  onDeductPoints: () => void,
  onRedeem: () => void, // 新增：兌換函式
  canManageScoreActions: boolean,
  colorTheme: 'blue' | 'green'
}) => {
  const isBlue = colorTheme === 'blue';
  
  return (
    <div className="relative group">
       {/* 模擬機票風格容器 */}
       <div className={`bg-nook-cream rounded-[2.5rem] border-[6px] ${isBlue ? 'border-nook-blue/30' : 'border-nook-green/30'} p-1 shadow-lg transition-transform hover:-translate-y-2`}>
         <div className={`rounded-[2rem] p-6 h-full flex flex-col relative overflow-hidden bg-stripes`}>
            {/* 背景裝飾圖案 */}
            <div className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full opacity-20 ${isBlue ? 'bg-nook-blue' : 'bg-nook-green'}`}></div>

            {/* 卡片頭部：頭像與名稱 */}
            <div className="flex justify-between items-start z-10 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-white border-4 border-nook-beige flex items-center justify-center text-5xl shadow-sm">
                        {user.avatar}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-nook-brown">{user.name}</h3>
                        <div className={`px-3 py-1 rounded-full text-white text-xs font-bold inline-block shadow-sm ${isBlue ? 'bg-nook-blue' : 'bg-nook-green'}`}>
                             目前總分
                        </div>
                    </div>
                </div>
            </div>

            {/* 分數顯示區 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 border-2 border-white shadow-inner mb-6 flex items-baseline justify-center gap-2">
                <span className={`text-6xl font-black ${isBlue ? 'text-nook-blueDark' : 'text-nook-greenDark'}`}>{score}</span>
                <span className="text-nook-brown/40 font-bold text-xl">分</span>
            </div>

            {/* 操作按鈕區：加分、扣分、兌換 */}
            <div className="grid grid-cols-2 gap-3 mt-auto z-10">
                {canManageScoreActions && (
                  <>
                    <Button 
                        className="py-3 text-lg col-span-1" 
                        variant={isBlue ? 'secondary' : 'success'} 
                        onClick={onAddPoints}
                        icon={<Icons.PlusCircle size={20} />}
                    >
                        加分
                    </Button>
                    <Button 
                        className="py-3 text-lg col-span-1" 
                        variant="danger" 
                        onClick={onDeductPoints}
                        icon={<Icons.MinusCircle size={20} />}
                    >
                        扣分
                    </Button>
                  </>
                )}
                
                {/* 新增：兌換獎勵按鈕 (紫色風格) */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onRedeem();
                  }}
                  className="col-span-2 py-3 rounded-full font-bold text-white bg-[#A88BFA] border-b-4 border-[#8B5CF6] active:border-b-0 active:translate-y-[4px] shadow-sm flex items-center justify-center transition-all hover:brightness-105"
                >
                  <Icons.Gift size={20} className="mr-2" />
                  兌換獎勵
                </button>
            </div>
         </div>
       </div>
    </div>
  );
};
