import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button } from './ui/Button';
import { Icons } from './Icons';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden leaf-pattern">
      {/* 裝飾背景 */}
      <div className="absolute -top-20 -right-20 w-72 md:w-96 h-72 md:h-96 bg-nook-yellow/40 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-20 -left-20 w-72 md:w-96 h-72 md:h-96 bg-nook-blue/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* 標題 */}
      <div className="text-center mb-8 md:mb-12 z-10 animate-pop">
        <div className="inline-block bg-nook-yellow px-6 md:px-8 py-2 md:py-3 rounded-full border-4 border-white mb-4 md:mb-6 shadow-md transform -rotate-2">
          <h1 className="text-2xl md:text-4xl font-black text-nook-brown tracking-widest">Family Points</h1>
        </div>
        <div className="bg-white/90 backdrop-blur-sm px-5 md:px-8 py-2 md:py-3 rounded-[2rem] inline-block shadow-sm border-2 border-white">
            <p className="text-nook-brown font-bold text-sm md:text-lg flex items-center gap-2">
               <span className="text-xl md:text-2xl">🏝️</span> 歡迎回到溫暖的家！請選擇成員
            </p>
        </div>
      </div>

      {/* 角色卡片列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl w-full z-10">
        {users.map((user, idx) => (
          <div key={user.id} className="transform hover:-translate-y-2 md:hover:-translate-y-3 transition-transform duration-300" style={{ animationDelay: `${idx * 150}ms` }}>
            <div 
              onClick={() => handleUserClick(user)}
              className="cursor-pointer bg-nook-cream rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-4 md:border-8 border-white shadow-xl hover:shadow-2xl h-full flex flex-col relative group"
            >
              {/* 卡片上半部色塊 */}
              <div className={`h-20 md:h-28 ${user.role === UserRole.PARENT ? 'bg-nook-orange' : 'bg-nook-green'} flex items-end justify-center pb-0 relative overflow-visible`}>
                 <div className="absolute -bottom-10 md:-bottom-12 w-24 h-24 md:w-32 md:h-32 rounded-full bg-white p-2 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <div className="w-full h-full rounded-full bg-nook-beige flex items-center justify-center text-4xl md:text-6xl border-2 border-nook-brown/10">
                        {user.avatar}
                    </div>
                 </div>
              </div>
              
              {/* 卡片下半部 */}
              <div className="pt-12 md:pt-16 pb-6 md:pb-10 px-4 md:px-6 text-center flex-1 flex flex-col items-center justify-end">
                 <h2 className="text-2xl md:text-3xl font-black text-nook-brown mb-2 md:mb-3">{user.name}</h2>
                 
                 <div className="mt-1 md:mt-2">
                    <span className={`px-4 md:px-5 py-1.5 md:py-2 rounded-full text-white text-sm md:text-base font-bold shadow-sm tracking-wide ${user.role === UserRole.PARENT ? 'bg-nook-orangeDark' : 'bg-nook-greenDark'}`}>
                        {getRoleLabel(user)}
                    </span>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 雲端帳號資訊 (整合在頁面底部) */}
      <div className="z-10 mt-8 md:mt-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm border-2 border-white shadow-sm rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-nook-brown/40 tracking-wider">☁️ 雲端帳號</p>
            <p className="text-sm font-bold text-nook-brown truncate">{cloudEmail}</p>
          </div>
          <button
            type="button"
            onClick={onCloudLogout}
            className="px-3 py-2 rounded-xl bg-nook-brown/10 text-nook-brown text-xs font-bold hover:bg-nook-brown/20 transition-colors flex-shrink-0"
          >
            切換帳號
          </button>
        </div>
      </div>
      
      {/* --- 家長密碼輸入視窗 (Modal) --- */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nook-brown/60 backdrop-blur-md">
          <div className="bg-nook-cream rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 w-full max-w-sm shadow-2xl border-4 md:border-8 border-white transform scale-100 animate-pop">
            <div className="text-center mb-6">
              <h3 className="text-lg md:text-xl font-black text-nook-brown mb-2">請輸入家長密碼</h3>
              
              {/* PIN 碼顯示點 */}
              <div className="flex justify-center gap-3 h-12 md:h-14 items-center bg-white rounded-2xl py-4 md:py-6 px-4 mb-2 border-2 border-nook-brown/10 shadow-inner">
                 {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-nook-brown scale-125' : 'bg-nook-brown/20'}`}></div>
                 ))}
              </div>
              {error && <p className="text-nook-red font-bold text-sm animate-pulse mt-2">密碼錯誤，請再試一次</p>}
            </div>

            {/* 數字鍵盤 */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
               {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                   <button 
                     key={num}
                     onClick={() => handlePinInput(num)}
                     className="h-14 md:h-16 rounded-2xl bg-white shadow-sm border-b-4 border-nook-brown/10 active:border-b-0 active:translate-y-[4px] font-bold text-xl md:text-2xl text-nook-brown hover:bg-nook-yellow/10 transition-colors"
                   >
                     {num}
                   </button>
               ))}
               <button onClick={() => setShowPinModal(false)} className="h-14 md:h-16 rounded-2xl bg-nook-red/10 text-nook-red font-bold flex items-center justify-center hover:bg-nook-red/20 active:translate-y-[2px]">
                  <Icons.X />
               </button>
               <button 
                 onClick={() => handlePinInput(0)}
                 className="h-14 md:h-16 rounded-2xl bg-white shadow-sm border-b-4 border-nook-brown/10 active:border-b-0 active:translate-y-[4px] font-bold text-xl md:text-2xl text-nook-brown hover:bg-nook-yellow/10"
               >
                 0
               </button>
               <button onClick={handleBackspace} className="h-14 md:h-16 rounded-2xl bg-nook-brown/10 text-nook-brown font-bold flex items-center justify-center hover:bg-nook-brown/20 active:translate-y-[2px]">
                  <Icons.ArrowLeft />
               </button>
            </div>

            <Button 
                variant="primary" 
                className="w-full text-base md:text-lg py-3 md:py-4 rounded-2xl" 
                onClick={handlePinSubmit}
                disabled={pin.length !== 6}
            >
                進入系統
            </Button>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-4 text-nook-brown/40 text-xs font-bold bg-white/50 px-3 py-1 rounded-full">
        Designed by Clyde v1.3
      </div>
    </div>
  );
};
