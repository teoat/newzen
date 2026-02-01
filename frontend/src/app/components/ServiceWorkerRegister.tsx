'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Zenith SW registered: ', registration.scope);
          },
          (err) => {
            console.log('Zenith SW registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return null;
}
