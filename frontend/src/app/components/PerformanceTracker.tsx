'use client';

import { useEffect } from 'react';
import PerformanceMonitor from '../../lib/performance';
import { logger } from '../../lib/logger';

export default function PerformanceTracker() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const monitor = new PerformanceMonitor();
      monitor.start((metrics) => {
        // Send metrics to analytics service
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'performance_metrics', {
            fcp: metrics.fcp,
            lcp: metrics.lcp,
            fid: metrics.fid,
            cls: metrics.cls
          });
        }
      });
      
      return () => {
        monitor.stop();
        const report = monitor.generateReport();
        logger.info('Performance Report:', { report });
      };
    }
    return undefined;
  }, []);

  return null;
}
