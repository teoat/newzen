'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Determine status inside effect to ensure consistency
    const updateStatus = () => {
        setIsOffline(!navigator.onLine);
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-rose-600 text-white rounded-full shadow-lg flex items-center gap-2 border border-rose-400/30 backdrop-blur-md"
        >
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-bold">Offline Mode</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
