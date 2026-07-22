import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button } from './ui/Button';
import { Icons } from './Icons';
import { GardenFlower } from './GardenFlower';

interface RoleSelectorProps {
  users: User[];
  onSelectUser: (user: User) => void;
  cloudEmail: string;
  onCloudLogout: () => void;
}

/**
 * RoleSelector 元件
 * 這是應用程式的入口點（登入頁面）。
 * 用戶選擇自己的頭像進行登入。如果是家長角色，會觸發 PIN 碼檢查。
 */
export const RoleSelector: React.FC<RoleSelectorProps> = ({ users, onSelectUser, cloudEmail, onCloudLogout }) => {
  // --- 狀態管理 ---
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [targetParent, setTargetParent] = useState<User | null>(null);

  // 家長登入密碼 (可在此處修改)
  const CORRECT_PIN = '080987';

  const handleUserClick = (user: User) => {
    if (user.role === UserRole.PARENT) {
      setTargetParent(user);
      setShowPinModal(true);
      setPin('');
      setError(false);
    } else {
      onSelectUser(user);
    }
  };

  const handlePinSubmit = () => {
    if (pin === CORRECT_PIN) {
      if (targetParent) {
        onSelectUser(targetParent);
      }
    } else {
      setError(true);
      setPin('');
    }
  };

  const handlePinInput = (num: number) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const getRoleLabel = (user: User) => {
    if (user.role === UserRole.PARENT) return '家長';
    if (user.id === 'child_1') return '寶貝一號'; 
    if (user.id === 'child_2') return '寶貝二號';
    return '可愛寶貝';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden leaf-pattern">
      <div className="text-center mb-5 z-10 animate-pop">
        <div className="flex items-center justify-center gap-2 mb-1">
          <GardenFlower size={30} />
          <h1 className="text-xl md:text-2xl font-black text-nook-brown tracking-wide">Sweet Home</h1>
        </div>
        <p className="text-nook-greenDark font-black text-sm">今天是誰要進入家庭花園？</p>
      </div>

      {/* 角色卡片列表 */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-4 max-w-2xl w-full z-10">
        {users.map((user, idx) => (
          <div key={user.id} className="transition-transform duration-200" style={{ animationDelay: `${idx * 80}ms` }}>
            <button
              type="button"
              onClick={() => handleUserClick(user)}
              className="w-full bg-white rounded-2xl soft-card p-3 md:p-4 h-full flex flex-col items-center text-center group hover:-translate-y-1 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nook-greenDark"
            >
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-3xl md:text-4xl mb-2 ring-4 ring-white ${user.role === UserRole.PARENT ? 'bg-nook-orange/20' : 'bg-nook-green/15'}`}>
                {user.avatar}
              </div>
              <h2 className="text-sm md:text-base font-black text-nook-brown leading-tight line-clamp-2">{user.name}</h2>
              <span className={`mt-1.5 px-2 py-0.5 rounded-full text-white text-[10px] font-bold ${user.role === UserRole.PARENT ? 'bg-nook-orangeDark' : 'bg-nook-greenDark'}`}>
                {getRoleLabel(user)}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* 雲端帳號資訊 (整合在頁面底部) */}
      <div className="z-10 mt-4 w-full max-w-sm">
        <div className="bg-white/80 rounded-xl px-3 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-nook-brown/40 tracking-wider">☁️ 雲端帳號</p>
            <p className="text-xs font-bold text-nook-brown truncate">{cloudEmail}</p>
          </div>
          <button
            type="button"
            onClick={onCloudLogout}
            className="px-3 py-1.5 rounded-lg bg-nook-brown/5 text-nook-brown/60 text-xs font-bold hover:bg-nook-brown/10 transition-colors flex-shrink-0"
          >
            切換帳號
          </button>
        </div>
      </div>
      
      {/* --- 家長密碼輸入視窗 (Modal) --- */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nook-brown/60">
          <div className="bg-nook-cream rounded-2xl p-5 w-full max-w-xs soft-card animate-pop">
            <div className="text-center mb-4">
              <h3 className="text-lg font-black text-nook-brown mb-2">家長密碼</h3>
              
              {/* PIN 碼顯示點 */}
              <div className="flex justify-center gap-2.5 h-11 items-center bg-white rounded-xl px-4 mb-2 border border-nook-brown/10">
                 {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-nook-greenDark' : 'bg-nook-brown/15'}`}></div>
                 ))}
              </div>
              {error && <p className="text-nook-red font-bold text-sm animate-pulse mt-2">密碼錯誤，請再試一次</p>}
            </div>

            {/* 數字鍵盤 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
               {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                   <button 
                     key={num}
                     onClick={() => handlePinInput(num)}
                     className="h-11 rounded-xl bg-white border-b-[3px] border-nook-brown/10 active:border-b-0 active:translate-y-[3px] font-bold text-lg text-nook-brown hover:bg-nook-yellow/10 transition-colors"
                   >
                     {num}
                   </button>
               ))}
               <button onClick={() => setShowPinModal(false)} className="h-11 rounded-xl bg-nook-red/10 text-nook-red font-bold flex items-center justify-center hover:bg-nook-red/20">
                  <Icons.X />
               </button>
               <button 
                 onClick={() => handlePinInput(0)}
                 className="h-11 rounded-xl bg-white border-b-[3px] border-nook-brown/10 active:border-b-0 active:translate-y-[3px] font-bold text-lg text-nook-brown hover:bg-nook-yellow/10"
               >
                 0
               </button>
               <button onClick={handleBackspace} className="h-11 rounded-xl bg-nook-brown/5 text-nook-brown font-bold flex items-center justify-center hover:bg-nook-brown/10">
                  <Icons.ArrowLeft />
               </button>
            </div>

            <Button 
                variant="primary" 
                className="w-full"
                onClick={handlePinSubmit}
                disabled={pin.length !== 6}
            >
                進入系統
            </Button>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-2 text-nook-brown/35 text-[10px] font-bold">
        Designed by Clyde v1.3
      </div>
    </div>
  );
};
