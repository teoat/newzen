'use client';

import { useEffect } from 'react';
import { logger } from '../../lib/logger';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            logger.info('Zenith SW registered: ' + registration.scope);
          },
          (err) => {
            logger.errorWithInfo('Zenith SW registration failed', err);
          }
        );
      });
    }
  }, []);

  return null;
}
