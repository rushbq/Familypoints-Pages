import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button } from './ui/Button';
import { Icons } from './Icons';

interface RoleSelectorProps {
  users: User[];
  onSelectUser: (user: User) => void;
}

/**
 * RoleSelector 元件
 * 這是應用程式的入口點（登入頁面）。
 * 用戶選擇自己的頭像進行登入。如果是家長角色，會觸發 PIN 碼檢查。
 */
export const RoleSelector: React.FC<RoleSelectorProps> = ({ users, onSelectUser }) => {
  // --- 狀態管理 ---
  const [showPinModal, setShowPinModal] = useState(false); // 控制 PIN 碼輸入框的顯示
  const [pin, setPin] = useState(''); // 儲存目前輸入的 PIN
  const [error, setError] = useState(false); // 錯誤狀態
  const [targetParent, setTargetParent] = useState<User | null>(null); // 暫存欲登入的家長使用者

  // 家長登入密碼 (可在此處修改)
  const CORRECT_PIN = '080987';

  /**
   * 處理使用者點擊事件
   * 如果是家長 -> 開啟 PIN 碼視窗
   * 如果是小孩 -> 直接登入
   */
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

  /**
   * 驗證 PIN 碼
   */
  const handlePinSubmit = () => {
    if (pin === CORRECT_PIN) {
      if (targetParent) {
        onSelectUser(targetParent);
      }
    } else {
      setError(true);
      setPin(''); // 錯誤時清空輸入
    }
  };

  /**
   * 處理虛擬鍵盤數字輸入
   */
  const handlePinInput = (num: number) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  /**
   * 處理退格鍵 (刪除最後一碼)
   */
  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  /**
   * 根據使用者 ID 取得顯示稱謂
   * 這裡定義了特定 ID 對應的顯示名稱
   */
  const getRoleLabel = (user: User) => {
    if (user.role === UserRole.PARENT) return '家長';
    // 根據 ID 判斷是哪位小朋友
    if (user.id === 'child_1') return '寶貝一號'; 
    if (user.id === 'child_2') return '寶貝二號';
    return '可愛寶貝'; // 預設值
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden leaf-pattern">
      {/* --- 裝飾背景元素 (增加活潑感) --- */}
      {/* 右上角黃色光暈 */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-nook-yellow/40 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      {/* 左下角藍色光暈 */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-nook-blue/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* --- 標題區域 --- */}
      <div className="text-center mb-12 z-10 animate-pop">
        <div className="inline-block bg-nook-yellow px-8 py-3 rounded-full border-4 border-white mb-6 shadow-md transform -rotate-2">
          <h1 className="text-4xl font-black text-nook-brown tracking-widest">Family Points</h1>
        </div>
        <div className="bg-white/90 backdrop-blur-sm px-8 py-3 rounded-[2rem] inline-block shadow-sm border-2 border-white">
            <p className="text-nook-brown font-bold text-lg flex items-center gap-2">
               <span className="text-2xl">🏝️</span> 歡迎回到溫暖的家！請選擇成員
            </p>
        </div>
      </div>

      {/* --- 角色卡片列表 --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full z-10">
        {users.map((user, idx) => (
          <div key={user.id} className="transform hover:-translate-y-3 transition-transform duration-300" style={{ animationDelay: `${idx * 150}ms` }}>
            <div 
              onClick={() => handleUserClick(user)}
              className="cursor-pointer bg-nook-cream rounded-[2.5rem] overflow-hidden border-8 border-white shadow-xl hover:shadow-2xl h-full flex flex-col relative group"
            >
              {/* 卡片上半部色塊 */}
              <div className={`h-28 ${user.role === UserRole.PARENT ? 'bg-nook-orange' : 'bg-nook-green'} flex items-end justify-center pb-0 relative overflow-visible`}>
                 {/* 頭像圓框 */}
                 <div className="absolute -bottom-12 w-32 h-32 rounded-full bg-white p-2 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <div className="w-full h-full rounded-full bg-nook-beige flex items-center justify-center text-6xl border-2 border-nook-brown/10">
                        {user.avatar}
                    </div>
                 </div>
              </div>
              
              {/* 卡片下半部內容 */}
              <div className="pt-16 pb-10 px-6 text-center flex-1 flex flex-col items-center justify-end">
                 <h2 className="text-3xl font-black text-nook-brown mb-3">{user.name}</h2>
                 
                 {/* 角色標籤 */}
                 <div className="mt-2">
                    <span className={`px-5 py-2 rounded-full text-white text-base font-bold shadow-sm tracking-wide ${user.role === UserRole.PARENT ? 'bg-nook-orangeDark' : 'bg-nook-greenDark'}`}>
                        {getRoleLabel(user)}
                    </span>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* --- 家長密碼輸入視窗 (Modal) --- */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nook-brown/60 backdrop-blur-md">
          <div className="bg-nook-cream rounded-[3rem] p-8 w-full max-w-sm shadow-2xl border-8 border-white transform scale-100 animate-pop">
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-nook-brown mb-2">請輸入家長密碼</h3>
              
              {/* PIN 碼顯示點 (實心/空心) */}
              <div className="flex justify-center gap-3 h-14 items-center bg-white rounded-2xl py-6 px-4 mb-2 border-2 border-nook-brown/10 shadow-inner">
                 {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-nook-brown scale-125' : 'bg-nook-brown/20'}`}></div>
                 ))}
              </div>
              {error && <p className="text-nook-red font-bold text-sm animate-pulse mt-2">密碼錯誤，請再試一次</p>}
            </div>

            {/* 數字鍵盤 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
               {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                   <button 
                     key={num}
                     onClick={() => handlePinInput(num)}
                     className="h-16 rounded-2xl bg-white shadow-sm border-b-4 border-nook-brown/10 active:border-b-0 active:translate-y-[4px] font-bold text-2xl text-nook-brown hover:bg-nook-yellow/10 transition-colors"
                   >
                     {num}
                   </button>
               ))}
               <button onClick={() => setShowPinModal(false)} className="h-16 rounded-2xl bg-nook-red/10 text-nook-red font-bold flex items-center justify-center hover:bg-nook-red/20 active:translate-y-[2px]">
                  <Icons.X />
               </button>
               <button 
                 onClick={() => handlePinInput(0)}
                 className="h-16 rounded-2xl bg-white shadow-sm border-b-4 border-nook-brown/10 active:border-b-0 active:translate-y-[4px] font-bold text-2xl text-nook-brown hover:bg-nook-yellow/10"
               >
                 0
               </button>
               <button onClick={handleBackspace} className="h-16 rounded-2xl bg-nook-brown/10 text-nook-brown font-bold flex items-center justify-center hover:bg-nook-brown/20 active:translate-y-[2px]">
                  <Icons.ArrowLeft />
               </button>
            </div>

            <Button 
                variant="primary" 
                className="w-full text-lg py-4 rounded-2xl" 
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