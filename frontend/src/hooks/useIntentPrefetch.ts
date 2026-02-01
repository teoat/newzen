/**
 * useIntentPrefetch
 * Predictive resource prefetching based on cursor trajectory and velocity
 */

import { useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';

interface Point {
  x: number;
  y: number;
  t: number;
}

export function useIntentPrefetch() {
  const router = useRouter();
  const prefetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouseHistoryRef = useRef<Point[]>([]);
  const MAX_HISTORY = 5;

  /**
   * Core prefetch logic
   */
  const prefetchRoute = useCallback((route: string, dataEndpoint?: string) => {
    router.prefetch(route);
    if (dataEndpoint) {
      mutate(dataEndpoint);
    }
  }, [router]);

  /**
   * Predictive Trajectory Analysis
   * Calculates velocity and determines if cursor is moving towards a target
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const point: Point = { x: e.clientX, y: e.clientY, t: Date.now() };
      mouseHistoryRef.current.push(point);
      
      if (mouseHistoryRef.current.length > MAX_HISTORY) {
        mouseHistoryRef.current.shift();
      }

      // Calculate velocity if we have enough points
      if (mouseHistoryRef.current.length >= 2) {
        const p1 = mouseHistoryRef.current[0];
        const p2 = mouseHistoryRef.current[mouseHistoryRef.current.length - 1];
        const dt = p2.t - p1.t;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        
        const velocity = Math.sqrt(dx * dx + dy * dy) / dt; // px/ms

        // If velocity is high, user is making a purposeful movement
        if (velocity > 0.5) {
          // Future implementation: Ray-casting to find potential intersection with interactive elements
          // For now, we rely on purposeful velocity to prime the engine
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  /**
   * Handler for onMouseEnter to implement velocity-aware prefetch
   */
  const handleIntent = useCallback((route: string, dataEndpoint?: string) => {
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    
    // High-speed approach gets priority prefetch (near-instant)
    const p1 = mouseHistoryRef.current[0];
    const p2 = mouseHistoryRef.current[mouseHistoryRef.current.length - 1];
    const velocity = p1 && p2 ? Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) / (p2.t - p1.t) : 0;
    
    const delay = velocity > 1.0 ? 0 : 50; // No delay if moving fast
    
    prefetchTimerRef.current = setTimeout(() => {
      prefetchRoute(route, dataEndpoint);
    }, delay);
  }, [prefetchRoute]);

  const cancelIntent = useCallback(() => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = null;
    }
  }, []);

  return {
    handleIntent,
    cancelIntent,
    prefetchRoute
  };
}
