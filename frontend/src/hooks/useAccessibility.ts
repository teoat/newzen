import { useEffect, useRef } from 'react';

/**
 * Focus Management Hook
 * Manages focus when opening/closing modals and dialogs
 * 
 * @param isOpen - Whether the modal/dialog is open
 * @param focusElement - Optional specific element to focus
 * 
 * @example
 * ```tsx
 * const dialogRef = useRef<HTMLDivElement>(null)
 * useFocusManagement(isOpen, dialogRef)
 * ```
 */
export const useFocusManagement = (isOpen: boolean, focusElement?: React.RefObject<HTMLElement>) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the specified element or first focusable element
      if (focusElement?.current) {
        focusElement.current.focus();
      } else {
        // Find first focusable element
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        firstElement?.focus();
      }
    } else if (previousFocusRef.current) {
      // Restore previous focus
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen, focusElement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);
};

/**
 * Keyboard Navigation Hook
 * Provides keyboard navigation for lists and grids
 * 
 * @param items - Array of items with IDs and refs
 * @param onEnter - Callback when Enter is pressed
 * @param onEscape - Callback when Escape is pressed
 * 
 * @example
 * ```tsx
 * useKeyboardNavigation(
 *   items.map(item => ({ id: item.id, element: item.ref.current })),
 *   (id) => handleSelect(id),
 *   () => handleClose()
 * )
 * ```
 */
export const useKeyboardNavigation = (
  items: Array<{ id: string; element: HTMLElement | null }>,
  onEnter?: (id: string) => void,
  onEscape?: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentIndex = items.findIndex(
        item => item.element === document.activeElement
      );

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (currentIndex < items.length - 1) {
            items[currentIndex + 1].element?.focus();
          } else {
            items[0].element?.focus(); // Wrap to first
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex > 0) {
            items[currentIndex - 1].element?.focus();
          } else {
            items[items.length - 1].element?.focus(); // Wrap to last
          }
          break;

        case 'Enter':
          event.preventDefault();
          if (currentIndex >= 0 && onEnter) {
            onEnter(items[currentIndex].id);
          }
          break;

        case 'Escape':
          event.preventDefault();
          if (onEscape) {
            onEscape();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, onEnter, onEscape]);
};

/**
 * ARIA Live Region Hook
 * Announces dynamic content changes to screen readers
 * 
 * @param message - Message to announce
 * @param priority - 'polite' for non-urgent, 'assertive' for urgent
 * 
 * @example
 * ```tsx
 * const announce = useCallback((msg: string) => {
 *   setLiveMessage(msg)
 * }, [])
 * useAriaLive(liveMessage, 'polite')
 * ```
 */
export const useAriaLive = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!announcementRef.current) {
      // Create live region
      announcementRef.current = document.createElement('div');
      announcementRef.current.setAttribute('aria-live', priority);
      announcementRef.current.setAttribute('aria-atomic', 'true');
      announcementRef.current.style.position = 'absolute';
      announcementRef.current.style.left = '-10000px';
      announcementRef.current.style.width = '1px';
      announcementRef.current.style.height = '1px';
      announcementRef.current.style.overflow = 'hidden';
      document.body.appendChild(announcementRef.current);
    }

    // Announce message
    if (announcementRef.current && message) {
      announcementRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  }, [message, priority]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);
};