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

  const childUsers = users.filter((user) => user.role === UserRole.CHILD);
  const parentUsers = users.filter((user) => user.role === UserRole.PARENT);

  return (
    <main className="relative min-h-screen overflow-hidden leaf-pattern">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8 md:px-6">
        <header className="mb-6 text-center animate-pop">
          <div className="mb-2 flex items-center justify-center gap-2">
            <GardenFlower size={34} />
            <h1 className="text-2xl font-black text-nook-brown">Sweet Home</h1>
          </div>
          <p className="text-base font-black text-nook-greenDark">選擇要進入鈞佑花園的角色</p>
          <p className="mt-1 text-sm font-bold text-nook-brown/75">孩子可以澆水與查看進度，家長可以管理積分與獎勵。</p>
        </header>

        <section aria-labelledby="child-role-title">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 id="child-role-title" className="text-sm font-black text-nook-brown">孩子的入口</h2>
            <span className="text-xs font-bold text-nook-greenDark">不用密碼</span>
          </div>
          <div className={`grid gap-3 ${childUsers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {childUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleUserClick(user)}
                className="group flex min-h-40 flex-col items-center justify-center rounded-2xl bg-white p-4 text-center soft-card transition-[transform,background-color] duration-200 hover:-translate-y-1 hover:bg-nook-green/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nook-greenDark focus-visible:ring-offset-2"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-nook-green/15 text-4xl ring-4 ring-nook-green/5" aria-hidden="true">
                  {user.avatar}
                </span>
                <span className="mt-3 text-lg font-black text-nook-brown">{user.name}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-nook-greenDark">
                  進入我的首頁 <Icons.ChevronRight size={15} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {parentUsers.length > 0 && (
          <section aria-labelledby="parent-role-title" className="mt-5">
            <h2 id="parent-role-title" className="mb-2 px-1 text-sm font-black text-nook-brown">家長管理</h2>
            <div className="space-y-2">
              {parentUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserClick(user)}
                  className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left soft-card transition-colors hover:bg-nook-orange/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nook-orangeDark focus-visible:ring-offset-2"
                >
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-nook-orange/15 text-2xl" aria-hidden="true">{user.avatar}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-black text-nook-brown">{user.name}</span>
                    <span className="block text-xs font-bold text-nook-brown/75">進入管理頁需要輸入 6 位數密碼</span>
                  </span>
                  <Icons.Shield size={20} className="flex-shrink-0 text-nook-orangeDark" />
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-5 flex items-center justify-between gap-3 border-t border-nook-greenDark/10 px-1 pt-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-nook-brown/75">☁️ 目前雲端帳號</p>
            <p className="truncate text-sm font-bold text-nook-brown">{cloudEmail}</p>
          </div>
          <button
            type="button"
            onClick={onCloudLogout}
            className="min-h-10 flex-shrink-0 rounded-xl px-3 text-xs font-bold text-nook-brown/75 transition-colors hover:bg-white hover:text-nook-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nook-greenDark"
          >
            切換帳號
          </button>
        </footer>
      </div>
      
      {/* --- 家長密碼輸入視窗 (Modal) --- */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nook-brown/60 p-4" role="dialog" aria-modal="true" aria-labelledby="parent-pin-title">
          <div className="w-full max-w-xs rounded-2xl bg-nook-cream p-5 soft-card animate-pop">
            <div className="text-center mb-4">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-nook-orange/15 text-nook-orangeDark"><Icons.Shield size={20} /></div>
              <h3 id="parent-pin-title" className="mb-1 text-lg font-black text-nook-brown">家長密碼</h3>
              <p className="mb-3 text-xs font-bold text-nook-brown/75">請輸入 6 位數密碼進入管理頁</p>
              
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
      
    </main>
  );
};
