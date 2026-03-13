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
import { RewardRedeemer } from './RewardRedeemer';

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
  onUpdateRewardItems: (items: any[]) => void;
  cloudEmail: string;
  onCloudLogout: () => void;
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
  onUpdateRewardItems,
  cloudEmail,
  onCloudLogout,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const isParent = currentUser.role === UserRole.PARENT;

  // --- 動態取得要顯示的 children ---
  const allChildren = data.users.filter(u => u.role === UserRole.CHILD);
  // 家長可看全部小孩，小孩只能看自己
  const visibleChildren = isParent
    ? allChildren
    : allChildren.filter(c => c.id === currentUser.id);

  // 計算每位可見小孩的分數
  const childScores = visibleChildren.map(child => ({
    user: child,
    score: calculateScore(child.id, data.records),
  }));

  // 色彩主題輪替
  const colorThemes: Array<'blue' | 'green'> = ['blue', 'green'];

  // --- 狀態：日期篩選器 (預設 7 天) ---
  const [daysFilter, setDaysFilter] = useState(7);

  // --- 狀態：控制 ActionLogger (加扣分) 視窗 ---
  const [loggingAction, setIsLoggingAction] = useState<{childId: string, type: 'POSITIVE' | 'NEGATIVE'} | null>(null);

  // --- 狀態：控制 RewardRedeemer (兌換獎勵) 視窗 ---
  const [redeemingReward, setIsRedeemingReward] = useState<{childId: string} | null>(null);

  // --- 狀態：手機版雲端帳號展開 ---
  const [showCloudInfo, setShowCloudInfo] = useState(false);

  /**
   * 渲染主要內容區域
   */
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 md:space-y-8 animate-pop">
            {/* 歡迎標題區塊 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-nook-brown">
                        {new Date().getHours() < 12 ? '早安！' : '你好！'} 
                        <span className="text-nook-greenDark ml-1">{currentUser.name}</span>
                    </h2>
                    <p className="text-nook-brown/60 font-bold mt-1 text-sm md:text-base">今天也要為了家庭和睦努力喔！</p>
                </div>
                <div className="bg-nook-yellow/40 px-4 py-1.5 md:px-6 md:py-2 rounded-full border-2 border-white shadow-sm flex-shrink-0">
                    <span className="font-bold text-nook-orangeDark text-sm md:text-lg">📅 {new Date().toLocaleDateString('zh-TW')}</span>
                </div>
            </div>

            {/* 成員積分卡片區塊 - 動態渲染 */}
            <div className={`grid gap-6 md:gap-8 ${visibleChildren.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
              {childScores.map((cs, idx) => (
                <ScoreCard 
                  key={cs.user.id}
                  user={cs.user} 
                  score={cs.score} 
                  onAddPoints={() => isParent && setIsLoggingAction({ childId: cs.user.id, type: 'POSITIVE' })}
                  onDeductPoints={() => isParent && setIsLoggingAction({ childId: cs.user.id, type: 'NEGATIVE' })}
                  onRedeem={() => setIsRedeemingReward({ childId: cs.user.id })}
                  canManageScoreActions={isParent}
                  colorTheme={colorThemes[idx % colorThemes.length]}
                />
              ))}
            </div>

             {/* 圖表區塊 (僅家長可見) */}
             {isParent && (
                <Card className="mt-4 md:mt-6 border-4 border-white bg-white/60">
                    <div className="flex items-center mb-4 gap-2">
                        <div className="p-2 bg-nook-green rounded-lg text-white"><Icons.BarChart2 size={20} /></div>
                        <h3 className="text-lg md:text-xl font-bold text-nook-brown">近期積分趨勢</h3>
                    </div>
                    <div className="h-48 md:h-64">
                       <RechartsWrapper data={data.records} users={data.users} />
                    </div>
                </Card>
             )}

             {/* 小孩專屬區塊 */}
             {!isParent && (
                <ChildOverviewSection
                  currentUser={currentUser}
                  records={data.records}
                  score={childScores[0]?.score ?? 0}
                  rewardItems={data.rewardItems}
                />
             )}
          </div>
        );
      case 'log': {
        // 日誌篩選邏輯
        const cutoffTime = Date.now() - (daysFilter * 24 * 60 * 60 * 1000);
        let filteredRecords = data.records.filter(r => r.timestamp >= cutoffTime);
        
        // 小孩只能看到自己的紀錄
        if (!isParent) {
          filteredRecords = filteredRecords.filter(r => r.childId === currentUser.id);
        }

        return (
           <Card variant="paper" className="min-h-[400px] md:min-h-[600px] bg-white">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 border-b-2 border-nook-brown/10 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <Icons.BookOpen className="text-nook-brown" size={28} />
                  <h2 className="text-xl md:text-2xl font-black text-nook-brown">活動日誌</h2>
                </div>
                
                {/* 顯示範圍選擇器 */}
                <div className="flex items-center gap-2 bg-nook-beige p-1.5 md:p-2 rounded-2xl">
                   <span className="text-xs md:text-sm font-bold text-nook-brown pl-2">顯示：</span>
                   <select 
                     value={daysFilter} 
                     onChange={(e) => setDaysFilter(Number(e.target.value))}
                     className="bg-white border-2 border-nook-brown/10 text-nook-brown font-bold text-xs md:text-sm rounded-xl py-1.5 md:py-2 px-2 md:px-3 outline-none focus:border-nook-green"
                   >
                     <option value={7}>最近 7 天</option>
                     <option value={14}>最近 14 天</option>
                     <option value={30}>最近 30 天</option>
                     <option value={9999}>全部紀錄</option>
                   </select>
                </div>
             </div>
             
             <div className="overflow-y-auto max-h-[50vh] md:max-h-[60vh] pr-2 md:pr-4 custom-scrollbar">
                <HistoryLog records={filteredRecords} showAll={true} />
             </div>
           </Card>
        );
      }
      case 'settings':
        return isParent ? (
          <SettingsPanel 
            appData={data}
            onUpdateItems={onUpdateItems} 
            onUpdateUsers={onUpdateUsers}
            onImportData={onImportData}
            onUpdateRewardItems={onUpdateRewardItems}
          />
        ) : <div className="p-12 md:p-20 text-center font-bold text-nook-brown/50 text-lg md:text-xl">🚧 施工中，閒人勿進！ 🚧</div>;
      default:
        return null;
    }
  };

  /**
   * 處理加/扣分提交
   */
  const handleActionSubmit = (itemId: string, note?: string, customPoints?: number) => {
    if (!isParent || !loggingAction) return;
    const child = data.users.find(u => u.id === loggingAction.childId);

    // 「其它」自訂分數
    if (itemId === '__custom__' && customPoints) {
      onAddRecord({
        childId: loggingAction.childId,
        childName: child?.name || 'Unknown',
        itemId: '__custom__',
        itemName: '其它',
        pointsChange: loggingAction.type === 'POSITIVE' ? customPoints : -customPoints,
        note,
        createdById: currentUser.id,
        createdByName: currentUser.name
      });
      setIsLoggingAction(null);
      return;
    }

    const item = data.scoreItems.find(i => i.id === itemId);
    if (!item) return;

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
        itemName: `兌換：${reward.label}`,
        pointsChange: -reward.points,
        note: '獎勵兌換',
        createdById: currentUser.id,
        createdByName: currentUser.name
    });
    setIsRedeemingReward(null);
  }

  // 計算兌換時的目前分數
  const getRedeemScore = (childId: string) => {
    return calculateScore(childId, data.records);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#CDF5E2]">
      {/* ===== 桌面版側邊導覽列 (md 以上) ===== */}
      <aside className="hidden md:flex w-24 lg:w-80 bg-nook-cream border-r-8 border-white flex-col flex-shrink-0 z-20 shadow-xl relative">
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
        
        <nav className="flex-1 px-2 lg:px-4 py-2 space-y-4 overflow-y-auto no-scrollbar">
          <NavItem 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
            icon={<Icons.Home size={24} />} 
            label="首頁" 
            bgColor="bg-nook-orange"
          />
          <NavItem 
            active={activeTab === 'log'} 
            onClick={() => setActiveTab('log')} 
            icon={<Icons.ClipboardList size={24} />} 
            label="日誌" 
            bgColor="bg-nook-blue"
          />
          {isParent && (
            <NavItem 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
              icon={<Icons.Settings size={24} />} 
              label="設定" 
              bgColor="bg-nook-brown"
            />
          )}
        </nav>

        <div className="p-3 lg:p-4 mt-auto space-y-3">
           {/* 使用者簡介卡片 */}
           <div className="bg-nook-yellow/20 p-3 lg:p-4 rounded-2xl lg:rounded-[2rem] border-2 border-white shadow-sm">
               <div className="flex items-center">
                 <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white flex items-center justify-center text-xl lg:text-2xl border-2 border-nook-brown/10 flex-shrink-0">
                   {currentUser.avatar}
                 </div>
                 <div className="overflow-hidden ml-3 hidden lg:block">
                   <p className="text-sm font-black text-nook-brown truncate">{currentUser.name}</p>
                   <p className="text-xs text-nook-brown/60 font-bold">{isParent ? '管理員' : '成員'}</p>
                 </div>
               </div>
           </div>

           {/* 雲端帳號資訊 (整合進側欄) */}
           <div className="bg-white/80 p-3 rounded-2xl border-2 border-nook-brown/5">
               <div className="hidden lg:flex items-center gap-2 mb-2">
                 <span className="text-[10px] font-black text-nook-brown/40 tracking-wider">☁️ 雲端帳號</span>
               </div>
               <p className="text-xs font-bold text-nook-brown/70 truncate hidden lg:block mb-2">{cloudEmail}</p>
               <button
                 type="button"
                 onClick={onCloudLogout}
                 className="w-full px-3 py-1.5 rounded-xl bg-nook-brown/5 text-nook-brown/60 text-xs font-bold hover:bg-nook-brown/10 transition-colors text-center"
               >
                 <span className="hidden lg:inline">切換雲端帳號</span>
                 <span className="lg:hidden">☁️</span>
               </button>
           </div>

          <button 
            onClick={onLogout}
            className="w-full group flex items-center justify-center lg:justify-start p-3 rounded-2xl text-nook-brown/40 hover:text-nook-red hover:bg-nook-red/10 transition-colors font-bold"
          >
            <Icons.LogOut size={22} className="lg:mr-2" />
            <span className="hidden lg:inline">離開 (登出)</span>
          </button>
        </div>
      </aside>

      {/* ===== 主要內容區域 ===== */}
      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        {/* 手機版頂部導覽 */}
        <header className="sticky top-0 bg-nook-cream/95 backdrop-blur-md z-30 px-4 py-3 flex justify-between items-center md:hidden border-b-4 border-white shadow-sm">
            <div className="flex items-center gap-2">
              <Icons.Leaf className="text-nook-green" size={20} />
              <h1 className="text-lg font-black text-nook-brown">Family Points</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* 雲端帳號按鈕 */}
              <button
                type="button"
                onClick={() => setShowCloudInfo(!showCloudInfo)}
                className="w-8 h-8 bg-nook-blue/20 rounded-full flex items-center justify-center text-sm"
                title="雲端帳號"
              >
                ☁️
              </button>
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border-2 border-nook-brown/10 text-lg">{currentUser.avatar}</div>
            </div>
        </header>

        {/* 手機版雲端帳號下拉面板 */}
        {showCloudInfo && (
          <div className="md:hidden bg-white border-b-4 border-nook-brown/5 px-4 py-3 flex items-center justify-between gap-3 animate-pop z-20 relative">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-nook-brown/40 tracking-wider">☁️ 雲端帳號</p>
              <p className="text-sm font-bold text-nook-brown truncate">{cloudEmail}</p>
            </div>
            <button
              type="button"
              onClick={onCloudLogout}
              className="px-3 py-1.5 rounded-xl bg-nook-brown/10 text-nook-brown text-xs font-bold hover:bg-nook-brown/20 transition-colors flex-shrink-0"
            >
              切換帳號
            </button>
          </div>
        )}

        <div className="p-4 md:p-8 lg:p-12 max-w-6xl mx-auto pb-28 md:pb-12">
          {renderContent()}
        </div>
      </main>

      {/* ===== 手機版底部導覽列 ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-nook-cream/95 backdrop-blur-md border-t-4 border-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch justify-around px-2 py-1 safe-bottom">
          <MobileNavItem
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<Icons.Home size={22} />}
            label="首頁"
          />
          <MobileNavItem
            active={activeTab === 'log'}
            onClick={() => setActiveTab('log')}
            icon={<Icons.ClipboardList size={22} />}
            label="日誌"
          />
          {isParent && (
            <MobileNavItem
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Icons.Settings size={22} />}
              label="設定"
            />
          )}
          <MobileNavItem
            active={false}
            onClick={onLogout}
            icon={<Icons.LogOut size={22} />}
            label="登出"
            isDanger
          />
        </div>
      </nav>

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
            currentScore={getRedeemScore(redeemingReward.childId)}
            targetChildName={data.users.find(u => u.id === redeemingReward.childId)?.name || ''}
          />
      )}
    </div>
  );
};

// --- 桌面版側欄按鈕元件 ---
const NavItem = ({ active, onClick, icon, label, bgColor, badge = 0 }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, bgColor: string, badge?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-[2rem] transition-all duration-200 group relative ${
      active 
        ? 'bg-white shadow-md transform scale-105' 
        : 'hover:bg-white/50 hover:scale-105'
    }`}
  >
    <div className={`w-11 h-11 lg:w-12 lg:h-12 rounded-[1.2rem] flex items-center justify-center text-white shadow-sm transition-transform group-hover:rotate-6 ${bgColor}`}>
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

// --- 手機版底部導覽按鈕元件 ---
const MobileNavItem = ({ active, onClick, icon, label, isDanger = false }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isDanger?: boolean }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all min-w-[60px] ${
      active 
        ? 'text-nook-greenDark bg-nook-green/10' 
        : isDanger 
          ? 'text-nook-brown/40 hover:text-nook-red' 
          : 'text-nook-brown/40 hover:text-nook-brown/70'
    }`}
  >
    {icon}
    <span className={`text-[10px] font-bold mt-0.5 ${active ? 'text-nook-greenDark' : ''}`}>{label}</span>
  </button>
);

// --- 小孩專屬概覽區塊 ---
const ENCOURAGEMENTS = [
  { min: 0, messages: ['加油！每一步都是進步 🌱', '新的一天，新的開始！💪', '繼續努力，你可以的！🌟'] },
  { min: 20, messages: ['表現不錯喔！繼續保持 🎯', '你正在進步中！👏', '離獎勵又近了一步！🏃'] },
  { min: 50, messages: ['哇！你好棒！🌈', '太厲害了，繼續加油！🔥', '你是家裡的小天使！😇'] },
  { min: 100, messages: ['超級厲害！你是最棒的！🏆', '積分王者就是你！👑', '你的努力大家都看到了！🎉'] },
];

const getEncouragement = (score: number): string => {
  const tier = [...ENCOURAGEMENTS].reverse().find(t => score >= t.min) || ENCOURAGEMENTS[0];
  const msgs = tier.messages;
  // 用日期當 seed，每天換一句
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % msgs.length;
  return msgs[dayIndex];
};

const ChildOverviewSection = ({ currentUser, records, score, rewardItems }: {
  currentUser: User;
  records: ScoreRecord[];
  score: number;
  rewardItems: { id: string; label: string; points: number; icon?: string }[];
}) => {
  const myRecords = records.filter(r => r.childId === currentUser.id);
  const recentRecords = [...myRecords].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  // 本週統計
  const now = Date.now();
  const weekStart = now - (new Date().getDay() * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(weekStart);
  startOfWeek.setHours(0, 0, 0, 0);
  const weekRecords = myRecords.filter(r => r.timestamp >= startOfWeek.getTime());
  const weekPositive = weekRecords.filter(r => r.pointsChange > 0);
  const weekNegative = weekRecords.filter(r => r.pointsChange < 0);
  const weekNet = weekRecords.reduce((sum, r) => sum + r.pointsChange, 0);

  // 最近可兌換的獎勵（分數最接近且買得起的）
  const affordableRewards = rewardItems.filter(r => r.points <= score).sort((a, b) => b.points - a.points);
  const nextReward = rewardItems.filter(r => r.points > score).sort((a, b) => a.points - b.points)[0];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 鼓勵語句 */}
      <Card className="border-4 border-nook-yellow/40 bg-nook-yellow/10">
        <div className="flex items-center gap-3">
          <div className="text-3xl md:text-4xl flex-shrink-0">
            {score >= 100 ? '👑' : score >= 50 ? '🌟' : score >= 20 ? '🌱' : '💪'}
          </div>
          <div>
            <p className="text-lg md:text-xl font-black text-nook-brown">{getEncouragement(score)}</p>
            {nextReward && (
              <p className="text-sm text-nook-brown/60 font-bold mt-1">
                再努力 <span className="text-nook-orangeDark">{nextReward.points - score}</span> 分就可以兌換「{nextReward.icon || '🎁'} {nextReward.label}」！
              </p>
            )}
            {!nextReward && affordableRewards.length > 0 && (
              <p className="text-sm text-nook-greenDark font-bold mt-1">
                你有足夠的分數兌換獎勵了！快去看看吧 🎉
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 本週表現統計 */}
      <Card className="border-4 border-white bg-white/60">
        <div className="flex items-center mb-4 gap-2">
          <div className="p-2 bg-nook-blue rounded-lg text-white"><Icons.Calendar size={20} /></div>
          <h3 className="text-lg md:text-xl font-bold text-nook-brown">本週表現</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-nook-green/10 rounded-2xl p-3 md:p-4 text-center">
            <div className="text-2xl md:text-3xl font-black text-nook-greenDark">{weekPositive.length}</div>
            <div className="text-xs md:text-sm font-bold text-nook-brown/60 mt-1">加分次數</div>
          </div>
          <div className="bg-nook-red/10 rounded-2xl p-3 md:p-4 text-center">
            <div className="text-2xl md:text-3xl font-black text-nook-red">{weekNegative.length}</div>
            <div className="text-xs md:text-sm font-bold text-nook-brown/60 mt-1">扣分次數</div>
          </div>
          <div className={`${weekNet >= 0 ? 'bg-nook-blue/10' : 'bg-nook-orange/10'} rounded-2xl p-3 md:p-4 text-center`}>
            <div className={`text-2xl md:text-3xl font-black ${weekNet >= 0 ? 'text-nook-blueDark' : 'text-nook-orangeDark'}`}>
              {weekNet >= 0 ? '+' : ''}{weekNet}
            </div>
            <div className="text-xs md:text-sm font-bold text-nook-brown/60 mt-1">淨得分</div>
          </div>
        </div>
      </Card>

      {/* 最近動態 */}
      <Card className="border-4 border-white bg-white/60">
        <div className="flex items-center mb-4 gap-2">
          <div className="p-2 bg-nook-orange rounded-lg text-white"><Icons.ClipboardList size={20} /></div>
          <h3 className="text-lg md:text-xl font-bold text-nook-brown">最近動態</h3>
        </div>
        {recentRecords.length === 0 ? (
          <p className="text-center text-nook-brown/40 font-bold py-6">還沒有任何紀錄喔！</p>
        ) : (
          <div className="space-y-2">
            {recentRecords.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-xl p-3 border-2 border-nook-brown/5">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-nook-brown text-sm md:text-base truncate">{r.itemName}</p>
                  <p className="text-xs text-nook-brown/40 font-bold">
                    {new Date(r.timestamp).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })}
                    {r.note && ` · ${r.note}`}
                  </p>
                </div>
                <span className={`font-black text-lg ml-3 flex-shrink-0 ${r.pointsChange > 0 ? 'text-nook-greenDark' : 'text-nook-red'}`}>
                  {r.pointsChange > 0 ? '+' : ''}{r.pointsChange}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// --- 積分卡片元件 (包含操作按鈕) ---
const ScoreCard = ({ user, score, onAddPoints, onDeductPoints, onRedeem, canManageScoreActions, colorTheme }: { 
  user: User, 
  score: number, 
  onAddPoints: () => void,
  onDeductPoints: () => void,
  onRedeem: () => void,
  canManageScoreActions: boolean,
  colorTheme: 'blue' | 'green'
}) => {
  const isBlue = colorTheme === 'blue';
  
  return (
    <div className="relative group">
       <div className={`bg-nook-cream rounded-[2rem] md:rounded-[2.5rem] border-4 md:border-[6px] ${isBlue ? 'border-nook-blue/30' : 'border-nook-green/30'} p-1 shadow-lg transition-transform hover:-translate-y-1 md:hover:-translate-y-2`}>
         <div className={`rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 h-full flex flex-col relative overflow-hidden bg-stripes`}>
            {/* 背景裝飾圖案 */}
            <div className={`absolute -right-10 -bottom-10 w-36 md:w-48 h-36 md:h-48 rounded-full opacity-20 ${isBlue ? 'bg-nook-blue' : 'bg-nook-green'}`}></div>

            {/* 卡片頭部：頭像與名稱 */}
            <div className="flex justify-between items-start z-10 mb-4 md:mb-6">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white border-4 border-nook-beige flex items-center justify-center text-3xl md:text-5xl shadow-sm">
                        {user.avatar}
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-nook-brown">{user.name}</h3>
                        <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-white text-[10px] md:text-xs font-bold inline-block shadow-sm ${isBlue ? 'bg-nook-blue' : 'bg-nook-green'}`}>
                             目前總分
                        </div>
                    </div>
                </div>
            </div>

            {/* 分數顯示區 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-3 md:p-4 border-2 border-white shadow-inner mb-4 md:mb-6 flex items-baseline justify-center gap-2">
                <span className={`text-4xl md:text-6xl font-black ${isBlue ? 'text-nook-blueDark' : 'text-nook-greenDark'}`}>{score}</span>
                <span className="text-nook-brown/40 font-bold text-lg md:text-xl">分</span>
            </div>

            {/* 操作按鈕區 */}
            <div className={`grid gap-2 md:gap-3 mt-auto z-10 ${canManageScoreActions ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {canManageScoreActions && (
                  <>
                    <Button 
                        className="py-2 md:py-3 text-base md:text-lg col-span-1" 
                        variant={isBlue ? 'secondary' : 'success'} 
                        onClick={onAddPoints}
                        icon={<Icons.PlusCircle size={18} />}
                    >
                        加分
                    </Button>
                    <Button 
                        className="py-2 md:py-3 text-base md:text-lg col-span-1" 
                        variant="danger" 
                        onClick={onDeductPoints}
                        icon={<Icons.MinusCircle size={18} />}
                    >
                        扣分
                    </Button>
                  </>
                )}
                
                {/* 兌換獎勵按鈕 */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onRedeem();
                  }}
                  className={`${canManageScoreActions ? 'col-span-2' : 'col-span-1'} py-2.5 md:py-3 rounded-full font-bold text-white bg-[#A88BFA] border-b-4 border-[#8B5CF6] active:border-b-0 active:translate-y-[4px] shadow-sm flex items-center justify-center transition-all hover:brightness-105 text-base md:text-lg`}
                >
                  <Icons.Gift size={18} className="mr-2" />
                  兌換獎勵
                </button>
            </div>
         </div>
       </div>
    </div>
  );
};
