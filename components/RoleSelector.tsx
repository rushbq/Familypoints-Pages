import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { Button } from './ui/Button';
import { Icons } from './Icons';
import { BeyTop } from './BeyTop';

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

  // Esc 關閉密碼視窗，和其他 modal 一致。
  useEffect(() => {
    if (!showPinModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowPinModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal]);

  const childUsers = users.filter((user) => user.role === UserRole.CHILD);
  const parentUsers = users.filter((user) => user.role === UserRole.PARENT);

  return (
    <main className="relative min-h-screen overflow-hidden arena-pattern">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8 md:px-6">
        <header className="mb-6 text-center animate-pop">
          <p className="font-display text-[10px] font-bold tracking-[0.34em] text-bey-cyan">BLADER SELECT</p>
          <h1 className="mt-1 font-display text-2xl font-black italic text-bey-ink">ENTER THE ARENA</h1>
          <p className="mt-2 text-base font-black text-bey-cyan">選擇要出戰的 Blader</p>
          <p className="mt-1 text-sm font-normal text-bey-dim">孩子可以查看自己的戰績，家長進入裁判席管理積分與獎勵。</p>
        </header>

        <section aria-labelledby="child-role-title">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 id="child-role-title" className="font-display text-[11px] font-bold tracking-[0.2em] text-bey-dim">BLADERS</h2>
            <span className="text-xs font-bold text-bey-cyan">不用密碼</span>
          </div>
          <div className={`grid gap-3 ${childUsers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {childUsers.map((user, index) => {
              // 兩個孩子各有隊色：第一位紫、第二位橘。青色是系統主色，不當隊色。
              const isHome = index % 2 === 0;
              const team = isHome ? 'purple' : 'orange';
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserClick(user)}
                  className={`group relative flex min-h-44 flex-col items-center justify-center overflow-hidden bg-bey-panel p-4 text-center soft-card clip-notch transition-[transform,background-color] duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bey-deep ${
                    isHome ? 'hover:bg-bey-purple/10 focus-visible:ring-bey-purple' : 'hover:bg-bey-orange/10 focus-visible:ring-bey-orange'
                  }`}
                >
                  <span
                    className="pointer-events-none absolute inset-0 arena-rings opacity-60"
                    style={{ '--rings-y': '38%' } as React.CSSProperties}
                    aria-hidden="true"
                  />
                  <span className="relative" aria-hidden="true">
                    <BeyTop color={team} size={72} speed="launch" />
                  </span>
                  <span className="relative mt-3 flex items-center gap-1.5 text-lg font-black text-bey-ink">
                    <span aria-hidden="true">{user.avatar}</span>
                    {user.name}
                  </span>
                  <span className={`relative mt-1 inline-flex items-center gap-1 font-display text-[10px] font-bold tracking-[0.18em] ${isHome ? 'text-bey-purple' : 'text-bey-orange'}`}>
                    LAUNCH <Icons.ChevronRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {parentUsers.length > 0 && (
          <section aria-labelledby="parent-role-title" className="mt-5">
            <h2 id="parent-role-title" className="mb-2 px-1 font-display text-[11px] font-bold tracking-[0.2em] text-bey-dim">REFEREE</h2>
            <div className="space-y-2">
              {parentUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserClick(user)}
                  className="flex min-h-16 w-full items-center gap-3 bg-bey-panel px-4 py-3 text-left soft-card clip-notch-sm transition-colors hover:bg-bey-yellow/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-bey-deep"
                >
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-bey-yellow/15 text-2xl" aria-hidden="true">{user.avatar}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-black text-bey-ink">{user.name}</span>
                    <span className="block text-xs font-normal text-bey-dim">進入裁判席需要輸入 6 位數密碼</span>
                  </span>
                  <Icons.Shield size={20} className="flex-shrink-0 text-bey-yellow" />
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-5 flex items-center justify-between gap-3 border-t border-bey-steel px-1 pt-4">
          <div className="min-w-0">
            <p className="text-xs font-normal text-bey-dim">☁️ 目前雲端帳號</p>
            <p className="truncate text-sm font-bold text-bey-ink">{cloudEmail}</p>
          </div>
          <button
            type="button"
            onClick={onCloudLogout}
            className="min-h-11 flex-shrink-0 rounded-xl px-3 text-xs font-normal text-bey-dim transition-colors hover:bg-bey-paper hover:text-bey-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-cyanDark"
          >
            切換帳號
          </button>
        </footer>
      </div>
      
      {/* --- 家長密碼輸入視窗 (Modal) --- */}
      {showPinModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bey-void/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parent-pin-title"
          onClick={() => setShowPinModal(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-bey-panel p-5 soft-card animate-pop"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-bey-yellow/15 text-bey-yellow"><Icons.Shield size={20} /></div>
              <h3 id="parent-pin-title" className="mb-1 text-lg font-black text-bey-ink">家長密碼</h3>
              <p className="mb-3 text-xs font-normal text-bey-dim">請輸入 6 位數密碼進入裁判席</p>
              
              {/* PIN 碼顯示點 */}
              <div className="flex justify-center gap-2.5 h-11 items-center bg-bey-paper rounded-xl px-4 mb-2 border border-bey-steel">
                 {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-bey-cyan' : 'bg-bey-ink/20'}`}></div>
                 ))}
              </div>
              {error && <p className="text-bey-red font-bold text-sm animate-pulse mt-2">密碼錯誤，請再試一次</p>}
            </div>

            {/* 數字鍵盤 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
               {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                   <button 
                     key={num}
                     onClick={() => handlePinInput(num)}
                     className="h-11 rounded-xl bg-bey-paper border-b-[3px] border-bey-steel active:border-b-0 active:translate-y-[3px] font-bold text-lg text-bey-ink hover:bg-bey-cyan/15 transition-colors"
                   >
                     {num}
                   </button>
               ))}
               <button onClick={() => setShowPinModal(false)} className="h-11 rounded-xl bg-bey-red/10 text-bey-red font-bold flex items-center justify-center hover:bg-bey-red/20">
                  <Icons.X />
               </button>
               <button 
                 onClick={() => handlePinInput(0)}
                 className="h-11 rounded-xl bg-bey-paper border-b-[3px] border-bey-steel active:border-b-0 active:translate-y-[3px] font-bold text-lg text-bey-ink hover:bg-bey-cyan/15"
               >
                 0
               </button>
               <button onClick={handleBackspace} className="h-11 rounded-xl bg-bey-ink/5 text-bey-ink font-bold flex items-center justify-center hover:bg-bey-ink/10">
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
