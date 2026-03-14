import React, { useState, useRef, useEffect } from 'react';
import { ScoreItem, ScoreType, AppState, User, RewardItem } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icons } from './Icons';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { getStorageInfo, cleanupOldRecords } from '../services/storageService';

interface SettingsPanelProps {
  appData: AppState;
  onUpdateItems: (items: ScoreItem[]) => void;
  onUpdateUsers: (users: User[]) => void;
  onImportData: (state: AppState) => void;
  onUpdateRewardItems: (items: RewardItem[]) => void; // 新增：更新獎勵函式
}

/**
 * 儲存空間資訊介面
 */
interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
  usedFormatted: string;
  quotaFormatted: string;
}

/**
 * 設定面板元件
 * 提供家長管理評分項目、獎勵項目、使用者資料及資料備份
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({ appData, onUpdateItems, onUpdateUsers, onImportData, onUpdateRewardItems }) => {
  // --- 新增評分項目的暫存狀態 ---
  const [newItem, setNewItem] = useState<Partial<ScoreItem>>({
    label: '',
    points: 5,
    type: ScoreType.POSITIVE,
    icon: '⭐'
  });

  // --- 新增獎勵項目的暫存狀態 (New) ---
  const [newReward, setNewReward] = useState<Partial<RewardItem>>({
    label: '',
    points: 30,
    icon: '🎁'
  });

  // --- 儲存空間資訊 ---
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // --- Modal 狀態管理 ---
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    isAlert?: boolean;
    variant?: 'primary' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 載入儲存空間資訊
  useEffect(() => {
    const loadStorageInfo = async () => {
      const info = await getStorageInfo();
      setStorageInfo(info);
    };
    loadStorageInfo();
  }, [appData]); // 當資料更新時重新載入

  // === 評分項目邏輯 ===
  
  const handleDeleteScoreItem = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: '刪除確認',
      message: '確定要刪除這個評分項目嗎？刪除後無法復原。',
      variant: 'danger',
      onConfirm: () => {
        onUpdateItems(appData.scoreItems.filter(i => i.id !== id));
      }
    });
  };

  const handleAddScoreItem = () => {
    if (!newItem.label || !newItem.points) return;
    
    const item: ScoreItem = {
      id: Date.now().toString(),
      label: newItem.label,
      points: Number(newItem.points),
      type: newItem.type || ScoreType.POSITIVE,
      icon: newItem.icon
    };

    onUpdateItems([...appData.scoreItems, item]);
    setNewItem({ label: '', points: 5, type: ScoreType.POSITIVE, icon: '⭐' });
  };

  // === 獎勵項目邏輯 (New) ===

  const handleDeleteRewardItem = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: '刪除確認',
      message: '確定要刪除這個獎勵項目嗎？',
      variant: 'danger',
      onConfirm: () => {
        onUpdateRewardItems(appData.rewardItems.filter(i => i.id !== id));
      }
    });
  };

  const handleAddRewardItem = () => {
    if (!newReward.label || !newReward.points) return;

    const item: RewardItem = {
        id: Date.now().toString(),
        label: newReward.label,
        points: Number(newReward.points),
        icon: newReward.icon
    };

    onUpdateRewardItems([...appData.rewardItems, item]);
    setNewReward({ label: '', points: 30, icon: '🎁' });
  };

  // === 使用者編輯邏輯 ===
  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    const updatedUsers = appData.users.map(u => u.id === id ? { ...u, ...updates } : u);
    onUpdateUsers(updatedUsers);
  };

  // === 資料備份與還原邏輯 ===
  const handleExport = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `family_points_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // === 清理舊紀錄邏輯 ===
  const handleCleanupOldRecords = (days: number) => {
    setModalConfig({
      isOpen: true,
      title: '清理確認',
      message: `確定要刪除超過 ${days} 天的紀錄嗎？此操作無法復原。建議先備份資料！`,
      variant: 'danger',
      onConfirm: async () => {
        setIsCleaningUp(true);
        try {
          const deletedCount = await cleanupOldRecords(days);
          // 重新載入儲存空間資訊
          const info = await getStorageInfo();
          setStorageInfo(info);
          
          setModalConfig({
            isOpen: true,
            title: '清理完成',
            message: `已清理 ${deletedCount} 筆舊紀錄`,
            isAlert: true,
            variant: 'primary'
          });
          
          // 觸發重新載入資料
          window.location.reload();
        } catch (err) {
          setModalConfig({
            isOpen: true,
            title: '錯誤',
            message: '清理失敗，請重試',
            isAlert: true,
            variant: 'danger'
          });
        } finally {
          setIsCleaningUp(false);
        }
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.users && json.records) {
            // 使用自定義 Modal 取代 window.confirm
            setModalConfig({
              isOpen: true,
              title: '還原資料警告',
              message: '警告：還原資料將會「完全覆蓋」目前的紀錄，確定要繼續嗎？',
              variant: 'danger',
              onConfirm: () => {
                onImportData(json);
                // 成功後顯示 Alert
                setTimeout(() => {
                    setModalConfig({
                        isOpen: true,
                        title: '通知',
                        message: '資料還原成功！',
                        isAlert: true,
                        variant: 'primary'
                    });
                }, 300);
              }
            });
        } else {
            setModalConfig({
                isOpen: true,
                title: '錯誤',
                message: '無效的備份檔案格式',
                isAlert: true,
                variant: 'danger'
            });
        }
      } catch (err) {
        console.error(err);
        setModalConfig({
            isOpen: true,
            title: '錯誤',
            message: '讀取檔案失敗',
            isAlert: true,
            variant: 'danger'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  // 篩選出加分與扣分項目以便分開顯示
  const positiveItems = appData.scoreItems.filter(i => i.type === ScoreType.POSITIVE);
  const negativeItems = appData.scoreItems.filter(i => i.type === ScoreType.NEGATIVE);

  return (
    <div className="space-y-12">
      
      {/* 0. 重要提醒 */}
      <Card title="⚠️ 重要提醒" className="bg-nook-yellow/20 border-nook-orange/30">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
              <span className="text-xl">☁️</span>
              <div>
                <p className="font-bold text-nook-brown">資料會同步到 Firebase 雲端</p>
                <p className="text-sm text-nook-brown/60">只要不同裝置登入同一組 Firebase 帳號，就會看到同一份家庭資料。</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
              <span className="text-xl">📱</span>
              <div>
                <p className="font-bold text-nook-brown">這裡顯示的是瀏覽器快取</p>
                <p className="text-sm text-nook-brown/60">就算本機快取被清掉，只要雲端資料還在，重新登入後仍可同步回來。</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
              <span className="text-xl">🗑️</span>
              <div>
                <p className="font-bold text-nook-brown">仍然建議定期備份</p>
                <p className="text-sm text-nook-brown/60">雲端同步可以降低遺失風險，但重要資料仍建議偶爾下載 JSON 備份。</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
              <span className="text-xl">🔒</span>
              <div>
                <p className="font-bold text-nook-brown">無痕/私密模式仍不建議</p>
                <p className="text-sm text-nook-brown/60">雖然主資料在雲端，但無痕模式會讓登入狀態與本機快取更不穩定。</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-nook-green/20 rounded-xl border-2 border-nook-green/30">
              <span className="text-xl">💡</span>
              <div>
                <p className="font-bold text-nook-greenDark">建議：定期備份！</p>
                <p className="text-sm text-nook-brown/60">請養成定期下載備份檔案的習慣，避免意外遺失珍貴的積分紀錄。</p>
              </div>
            </div>
          </div>
      </Card>

      {/* 1. 資料管理 */}
      <Card title="💾 資料管理" className="bg-white border-nook-blue/30">
          {/* 儲存空間顯示 */}
          {storageInfo && (
            <div className="mb-6 p-4 bg-nook-beige/30 rounded-2xl border-2 border-nook-brown/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-nook-brown text-sm">瀏覽器快取使用量</span>
                <span className="text-xs font-bold text-nook-brown/60">
                  {storageInfo.usedFormatted} / {storageInfo.quotaFormatted}
                </span>
              </div>
              <div className="w-full h-3 bg-nook-brown/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    storageInfo.percentage > 80 
                      ? 'bg-nook-red' 
                      : storageInfo.percentage > 50 
                        ? 'bg-nook-orange' 
                        : 'bg-nook-green'
                  }`}
                  style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-nook-brown/50">
                  目前有 {appData.records.length} 筆紀錄
                </span>
                <span className="text-xs font-bold text-nook-brown/60">
                  {storageInfo.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                  <p className="text-nook-brown font-bold mb-2">主資料已同步到 Firebase，這裡仍可下載 JSON 備份</p>
                  <p className="text-nook-brown/60 text-sm">如果你要換帳號、重設資料，或只是想留一份保險備份，建議偶爾下載一次。</p>
              </div>
              <div className="flex flex-wrap gap-4">
                  <Button onClick={handleExport} variant="secondary" icon={<Icons.Download size={20} />}>
                      備份資料
                  </Button>
                  <Button onClick={handleImportClick} variant="outline" icon={<Icons.Upload size={20} />}>
                      還原資料
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
              </div>
          </div>

          {/* 清理舊紀錄區塊 */}
          <div className="mt-6 pt-6 border-t-2 border-nook-brown/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-nook-brown">🧹 清理舊紀錄</p>
                <p className="text-nook-brown/60 text-sm">刪除過舊的紀錄以釋放儲存空間</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCleanupOldRecords(365)}
                  disabled={isCleaningUp}
                >
                  保留一年
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCleanupOldRecords(180)}
                  disabled={isCleaningUp}
                >
                  保留半年
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCleanupOldRecords(90)}
                  disabled={isCleaningUp}
                >
                  保留三個月
                </Button>
              </div>
            </div>
          </div>
      </Card>

      {/* 2. 成員設定 */}
      <Card title="👥 成員設定" className="bg-white border-nook-orange/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {appData.users.map(user => (
                  <div key={user.id} className="p-4 rounded-2xl bg-nook-beige/30 border-2 border-nook-brown/10 flex flex-col items-center">
                      <div className="text-4xl mb-2">{user.avatar}</div>
                      <div className="w-full space-y-2">
                          <div>
                              <label className="text-xs font-bold text-nook-brown/50">顯示名稱</label>
                              <input 
                                type="text" 
                                value={user.name} 
                                onChange={(e) => handleUpdateUser(user.id, { name: e.target.value })}
                                className="w-full bg-white border border-nook-brown/20 rounded-lg px-2 py-1 text-nook-brown font-bold text-center"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-nook-brown/50">頭像 (Emoji)</label>
                              <input 
                                type="text" 
                                value={user.avatar} 
                                onChange={(e) => handleUpdateUser(user.id, { avatar: e.target.value })}
                                className="w-full bg-white border border-nook-brown/20 rounded-lg px-2 py-1 text-nook-brown font-bold text-center"
                              />
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </Card>

      {/* 3. 評分項目管理 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 新增評分項目表單 */}
        <Card title="🔧 新增評分項目" className="lg:col-span-2 bg-nook-cream border-ac-brown/10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">項目名稱</label>
                <input 
                type="text" 
                value={newItem.label}
                onChange={e => setNewItem({...newItem, label: e.target.value})}
                className="w-full p-4 border-2 border-nook-brown/10 rounded-2xl focus:ring-4 focus:ring-nook-green/20 focus:border-nook-green outline-none text-nook-brown font-bold bg-white"
                placeholder="例如：整理房間"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">分數權重</label>
                <input 
                type="number" 
                value={newItem.points}
                onChange={e => setNewItem({...newItem, points: Number(e.target.value)})}
                className="w-full p-4 border-2 border-nook-brown/10 rounded-2xl focus:ring-4 focus:ring-nook-green/20 focus:border-nook-green outline-none text-nook-brown font-bold bg-white"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">類型</label>
                <select 
                value={newItem.type}
                onChange={e => setNewItem({...newItem, type: e.target.value as ScoreType})}
                className="w-full p-4 border-2 border-nook-brown/10 rounded-2xl focus:ring-4 focus:ring-nook-green/20 focus:border-nook-green outline-none bg-white text-nook-brown font-bold cursor-pointer"
                >
                <option value={ScoreType.POSITIVE}>加分項目 (+)</option>
                <option value={ScoreType.NEGATIVE}>扣分項目 (-)</option>
                </select>
            </div>
            </div>
            
            <div className="mt-6">
            <label className="block text-sm font-bold text-nook-brown mb-3 ml-1">選擇圖示</label>
            <div className="flex gap-3 flex-wrap">
                {['⭐','🧹','📚','🤝','🎒','💢','🥦','💯','🏃','💤','🎨','🎹','🐶','🦷','🛏️','👕','🍳','✏️','🙏','🧮','🎯','🚿','📖','🧸','💻','🚲','🎻','🧩','🌱','🐱','😡','📱','🍬','👊','⏰','🗣️'].map(icon => (
                    <button 
                    type="button"
                    key={icon}
                    onClick={() => setNewItem({...newItem, icon})}
                    className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center border-2 transition-all ${newItem.icon === icon ? 'border-nook-green bg-nook-green text-white scale-110 shadow-md' : 'border-nook-brown/10 hover:bg-white hover:border-nook-brown/30 bg-white/50'}`}
                    >
                    {icon}
                    </button>
                ))}
                <Button onClick={handleAddScoreItem} className="ml-auto bg-nook-brown text-white border-nook-brown hover:bg-nook-brown/90" icon={<Icons.Plus size={20} />}>
                    新增項目
                </Button>
            </div>
            </div>
        </Card>

        {/* 顯示加分項目列表 */}
        <div className="space-y-4">
            <div className="bg-nook-green/20 p-4 rounded-t-[2rem] rounded-b-lg border-b-4 border-nook-green/30 text-center">
                <h3 className="font-black text-nook-brown text-xl flex items-center justify-center gap-2"><Icons.Trophy className="text-nook-greenDark"/> 加分項目</h3>
            </div>
            <div className="space-y-3 h-96 overflow-y-auto pr-2 custom-scrollbar">
                {positiveItems.map(item => (
                    <ItemRow key={item.id} label={item.label} points={item.points} icon={item.icon} type={item.type} onDelete={() => handleDeleteScoreItem(item.id)} />
                ))}
            </div>
        </div>

        {/* 顯示扣分項目列表 */}
        <div className="space-y-4">
            <div className="bg-nook-red/20 p-4 rounded-t-[2rem] rounded-b-lg border-b-4 border-nook-red/30 text-center">
                <h3 className="font-black text-nook-brown text-xl flex items-center justify-center gap-2"><Icons.AlertCircle className="text-nook-red"/> 扣分項目</h3>
            </div>
            <div className="space-y-3 h-96 overflow-y-auto pr-2 custom-scrollbar">
                {negativeItems.map(item => (
                    <ItemRow key={item.id} label={item.label} points={item.points} icon={item.icon} type={item.type} onDelete={() => handleDeleteScoreItem(item.id)} />
                ))}
            </div>
        </div>
      </div>

      {/* 4. 獎勵項目管理 (New) */}
      <Card title="🎁 獎勵兌換項目管理" className="bg-[#F3E8FF] border-[#D8B4FE]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-8">
            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">獎勵名稱</label>
                <input 
                type="text" 
                value={newReward.label}
                onChange={e => setNewReward({...newReward, label: e.target.value})}
                className="w-full p-4 border-2 border-nook-brown/10 rounded-2xl focus:ring-4 focus:ring-[#A88BFA]/20 focus:border-[#A88BFA] outline-none text-nook-brown font-bold bg-white"
                placeholder="例如：玩 Switch 30分鐘"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">兌換點數 (成本)</label>
                <input 
                type="number" 
                value={newReward.points}
                onChange={e => setNewReward({...newReward, points: Number(e.target.value)})}
                className="w-full p-4 border-2 border-nook-brown/10 rounded-2xl focus:ring-4 focus:ring-[#A88BFA]/20 focus:border-[#A88BFA] outline-none text-nook-brown font-bold bg-white"
                />
            </div>
            <div className="flex items-end">
                <Button onClick={handleAddRewardItem} className="w-full bg-[#A88BFA] text-white border-[#8B5CF6] hover:bg-[#A88BFA]/90" icon={<Icons.Plus size={20} />}>
                    新增獎勵
                </Button>
            </div>
          </div>

          <div className="mt-4 mb-8">
            <label className="block text-sm font-bold text-nook-brown mb-3 ml-1">選擇圖示</label>
            <div className="flex gap-3 flex-wrap">
                {['🎁','🎮','📺','🍦','🍕','🎬','🛍️','🏖️','🎢','🧁','🍫','🎪','🎠','🎡','🎈','🎉','🌈','🎵','🐾','🦄','🍿','🎲','🏕️','🎂','⚽','🤖','🧲','🎭'].map(icon => (
                    <button
                    type="button"
                    key={icon}
                    onClick={() => setNewReward({...newReward, icon})}
                    className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center border-2 transition-all ${newReward.icon === icon ? 'border-[#A88BFA] bg-[#A88BFA] text-white scale-110 shadow-md' : 'border-nook-brown/10 hover:bg-white hover:border-nook-brown/30 bg-white/50'}`}
                    >
                    {icon}
                    </button>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {appData.rewardItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-[1.5rem] border-2 border-[#D8B4FE] shadow-sm">
                   <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-[#F3E8FF] rounded-2xl flex items-center justify-center text-2xl">
                           {item.icon || '🎁'}
                       </div>
                       <div>
                           <div className="font-bold text-nook-brown text-lg">{item.label}</div>
                           <div className="text-xs font-black px-2 py-0.5 rounded-full inline-block bg-[#A88BFA] text-white">
                               {item.points} pt
                           </div>
                       </div>
                   </div>
                   <button 
                     type="button"
                     onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRewardItem(item.id);
                     }} 
                     className="text-nook-brown/30 hover:text-nook-red hover:bg-nook-red/10 p-3 rounded-xl transition-colors"
                   >
                     <Icons.Trash2 size={20} />
                   </button>
                </div>
             ))}
             {appData.rewardItems.length === 0 && (
                 <div className="col-span-full text-center text-nook-brown/40 py-4 font-bold">沒有獎勵項目</div>
             )}
          </div>
      </Card>

      {/* 共用確認視窗 */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        isAlert={modalConfig.isAlert}
        variant={modalConfig.variant}
      />

    </div>
  );
};

// --- 通用列表列元件 (用於設定頁面) ---
interface ItemRowProps {
  label: string;
  points: number;
  icon?: string;
  type?: ScoreType;
  onDelete: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ label, points, icon, type, onDelete }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-[1.5rem] border-2 border-nook-brown/5 hover:border-nook-brown/20 transition-all shadow-sm group">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-nook-beige rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <div className="font-bold text-nook-brown text-lg">{label}</div>
        <div className={`text-xs font-black px-2 py-0.5 rounded-full inline-block ${type === ScoreType.POSITIVE ? 'bg-nook-green/20 text-nook-greenDark' : 'bg-nook-red/20 text-nook-red'}`}>
          {type === ScoreType.POSITIVE ? '+' : '-'}{points}
        </div>
      </div>
    </div>
    <button 
      type="button"
      onClick={(e) => {
          e.stopPropagation();
          onDelete();
      }} 
      className="text-nook-brown/30 hover:text-nook-red hover:bg-nook-red/10 p-3 rounded-xl transition-colors"
    >
      <Icons.Trash2 size={20} />
    </button>
  </div>
);
