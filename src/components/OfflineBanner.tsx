import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[10000] px-4 pt-4 flex justify-center pointer-events-none"
        >
          <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <WifiOff className="w-4 h-4 text-red-500" />
            <p className="text-red-500 text-xs font-bold leading-none">
              오프라인 상태입니다
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
