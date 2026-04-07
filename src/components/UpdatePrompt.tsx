import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

export default function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error: unknown) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[9999] flex justify-center"
        >
          <div className="bg-[#1e1e24] border border-[#cc97ff]/20 backdrop-blur-xl shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 max-w-md w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#cc97ff]/10 flex items-center justify-center text-[#cc97ff]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">
                  {offlineReady ? '오프라인 준비 완료' : '새로운 버전이 있습니다'}
                </p>
                <p className="text-gray-400 text-xs">
                  {offlineReady ? '이제 오프라인에서도 사용할 수 있습니다.' : '최신 기능을 위해 앱을 업데이트하세요.'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {needRefresh && (
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="px-4 py-2 bg-[#cc97ff] text-black text-xs font-bold rounded-xl hover:scale-105 transition-transform active:scale-95"
                >
                  새로고침
                </button>
              )}
              <button
                onClick={close}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
