import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * PWA 更新提示元件
 * 當 Service Worker 偵測到新版本時，顯示更新提示讓使用者手動觸發更新
 */
export const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // 每 60 秒檢查一次是否有新版本
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="animate-pop bg-white rounded-3xl shadow-2xl p-6 mx-4 max-w-sm w-full border-4 border-nook-green">
        <div className="text-center">
          <div className="text-5xl mb-3">🍃</div>
          <h2 className="text-xl font-bold text-nook-brown mb-2">發現新版本！</h2>
          <p className="text-nook-brown/70 text-sm mb-5">
            系統已更新，請按下「立即更新」以使用最新功能，避免資料格式不相容。
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-5 py-2.5 rounded-full font-bold text-nook-brown/60 bg-nook-beige hover:bg-nook-beige/80 transition-colors"
            >
              稍後再說
            </button>
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-5 py-2.5 rounded-full font-bold text-white bg-nook-green hover:bg-nook-greenDark transition-colors shadow-lg"
            >
              立即更新
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
