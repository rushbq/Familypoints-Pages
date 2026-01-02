import React from 'react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean; // 如果為 true，則只顯示確認按鈕 (當作 Alert 使用)
  variant?: 'primary' | 'danger';
}

/**
 * 客製化確認視窗
 * 用於解決 Sandbox 環境下 window.confirm 無法使用的問題，
 * 同時提供一致的 UI 風格。
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "確定", 
  cancelText = "取消", 
  isAlert = false,
  variant = 'primary'
}) => {
  if (!isOpen) return null;

  return (
    // z-index 設為 100 以確保蓋過其他 Modal (如 RewardRedeemer)
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-nook-brown/40 backdrop-blur-sm animate-pop" 
      onClick={(e) => e.stopPropagation()}
    >
       <div className="bg-nook-cream rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border-[6px] border-white flex flex-col items-center text-center relative">
          
          {/* 標題 */}
          <h3 className="text-xl font-black text-nook-brown mb-3">{title}</h3>
          
          {/* 內容 */}
          <p className="text-nook-brown/80 font-bold mb-8 whitespace-pre-wrap leading-relaxed">
            {message}
          </p>
          
          {/* 按鈕區 */}
          <div className="flex gap-3 w-full justify-center">
             {!isAlert && (
               <Button 
                 variant="ghost" 
                 onClick={onClose} 
                 className="flex-1"
               >
                 {cancelText}
               </Button>
             )}
             <Button 
                variant={variant} 
                onClick={() => { 
                    if (onConfirm) onConfirm(); 
                    onClose(); 
                }}
                className="flex-1 shadow-md"
             >
                {confirmText}
             </Button>
          </div>
       </div>
    </div>
  );
};