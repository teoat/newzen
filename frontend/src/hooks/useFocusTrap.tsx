/**
 * Focus Trap Hook
 * Traps focus within a container for accessible modals
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Focus trap options
 */
interface FocusTrapOptions {
  /** Whether the trap is active */
  active?: boolean;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
  /** Callback when a focusable element is clicked outside */
  onClickOutside?: () => void;
}

/**
 * useFocusTrap - Hook to trap focus within a container
 * Essential for accessible modal components
 * 
 * @param containerRef - Ref to the container element
 * @param options - Configuration options
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null)
 * 
 * useFocusTrap(containerRef, {
 *   active: isOpen,
 *   onEscape: () => setIsOpen(false),
 * })
 * ```
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  options: FocusTrapOptions = {}
) {
  const { active = true, onEscape, onClickOutside } = options;
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!active) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onEscape?.();
      return;
    }

    if (e.key === 'Tab') {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          e.stopPropagation();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          e.stopPropagation();
          firstElement.focus();
        }
      }
    }
  }, [active, containerRef, onEscape]);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleClickOutside = (e: MouseEvent) => {
      if (!container.contains(e.target as Node)) {
        onClickOutside?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);

      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, containerRef, handleKeyDown, onClickOutside]);
}

/**
 * Focus ring styles for keyboard navigation
 */
export const focusRingStyles = `
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-indigo-500
  focus-visible:ring-offset-2
  focus-visible:ring-offset-slate-900
`;

/**
 * Skip link component for keyboard users
 */
export function SkipLink({
  targetId,
  children = 'Skip to main content',
}: {
  targetId: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={`#${targetId}`}
      className="
        sr-only
        focus:not-sr-only
        focus:absolute
        focus:top-4
        focus:left-4
        focus:z-50
        focus:px-4
        focus:py-2
        focus:bg-indigo-600
        focus:text-white
        focus:rounded-lg
        focus:font-bold
        focus:uppercase
        focus:tracking-widest
        focus:text-xs
      "
    >
      {children}
    </a>
  );
}

export default useFocusTrap;
