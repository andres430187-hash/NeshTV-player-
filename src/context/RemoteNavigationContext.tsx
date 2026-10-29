import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export interface BackHandler {
  id: string;
  priority: number; // Higher number gets evaluated first (e.g., 300=exit dialog, 200=app modal, 120=fullscreen TV, 100=vod modal, 10=view, 1=root)
  handleBack: () => boolean; // return true if handled (consumed), false to pass to next handler
}

interface RemoteNavigationContextType {
  deviceMode: 'tv' | 'mobile';
  setDeviceMode: (mode: 'tv' | 'mobile') => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  simulateKey: (key: string) => void;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  registerBackHandler: (handler: BackHandler) => () => void;
  triggerBack: () => boolean;
}

const RemoteNavigationContext = createContext<RemoteNavigationContextType | undefined>(undefined);

export const RemoteNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceMode, setDeviceMode] = useState<'tv' | 'mobile'>('tv');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<string>('login');
  const lastKeyTimeRef = useRef<number>(0);

  const handleSpatialMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    // Find all visible focusable elements in DOM
    const focusables = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-tv-focus="true"], .tv-focusable, button:not([disabled]), input:not([disabled]), a[href], select:not([disabled])'
      )
    ).filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    });

    if (focusables.length === 0) return;

    const currentFocused = document.activeElement as HTMLElement;
    const currentIndex = focusables.indexOf(currentFocused);

    if (currentIndex === -1) {
      if (focusedId) {
        const found = focusables.find(el => el.getAttribute('data-focus-id') === focusedId || el.id === focusedId);
        if (found) {
          found.focus();
          setFocusedId(found.getAttribute('data-focus-id') || found.id || null);
          return;
        }
      }
      focusables[0].focus();
      setFocusedId(focusables[0].getAttribute('data-focus-id') || focusables[0].id || null);
      return;
    }

    const currentRect = currentFocused.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2,
    };

    let bestCandidate: HTMLElement | null = null;
    let minDistance = Infinity;

    for (const el of focusables) {
      if (el === currentFocused) continue;
      const rect = el.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      const dx = center.x - currentCenter.x;
      const dy = center.y - currentCenter.y;

      let isDirectionValid = false;
      let primaryDist = 0;
      let secondaryDist = 0;

      if (direction === 'up' && dy < -5) {
        isDirectionValid = true;
        primaryDist = Math.abs(dy);
        secondaryDist = Math.abs(dx);
      } else if (direction === 'down' && dy > 5) {
        isDirectionValid = true;
        primaryDist = Math.abs(dy);
        secondaryDist = Math.abs(dx);
      } else if (direction === 'left' && dx < -5) {
        isDirectionValid = true;
        primaryDist = Math.abs(dx);
        secondaryDist = Math.abs(dy);
      } else if (direction === 'right' && dx > 5) {
        isDirectionValid = true;
        primaryDist = Math.abs(dx);
        secondaryDist = Math.abs(dy);
      }

      if (isDirectionValid) {
        const score = primaryDist + secondaryDist * 1.6;
        if (score < minDistance) {
          minDistance = score;
          bestCandidate = el;
        }
      }
    }

    // Fallback if strict 2D spatial didn't find candidate
    if (!bestCandidate) {
      if (direction === 'down' || direction === 'right') {
        const nextIdx = (currentIndex + 1) % focusables.length;
        bestCandidate = focusables[nextIdx];
      } else {
        const prevIdx = (currentIndex - 1 + focusables.length) % focusables.length;
        bestCandidate = focusables[prevIdx];
      }
    }

    if (bestCandidate) {
      bestCandidate.focus();
      try {
        bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } catch {}
      setFocusedId(bestCandidate.getAttribute('data-focus-id') || bestCandidate.id || null);
    }
  }, [focusedId]);

  const backHandlersRef = useRef<BackHandler[]>([]);

  const registerBackHandler = useCallback((handler: BackHandler) => {
    backHandlersRef.current = [
      ...backHandlersRef.current.filter((h) => h.id !== handler.id),
      handler,
    ];
    return () => {
      backHandlersRef.current = backHandlersRef.current.filter((h) => h.id !== handler.id);
    };
  }, []);

  const triggerBack = useCallback((): boolean => {
    // Sort descending by priority (highest priority runs first)
    const handlers = [...backHandlersRef.current].sort((a, b) => b.priority - a.priority);
    for (const h of handlers) {
      try {
        const handled = h.handleBack();
        if (handled) {
          return true;
        }
      } catch (err) {
        console.error('Error in back handler:', h.id, err);
      }
    }

    // Fallback: check if there is an active back button in DOM
    const backBtn = document.querySelector<HTMLElement>('[data-action="back"]');
    if (backBtn && backBtn.offsetParent !== null) {
      backBtn.click();
      return true;
    }

    return false;
  }, []);

  // Listen to Android hardware back button (popstate) and keep history primed so app doesn't close
  useEffect(() => {
    try {
      window.history.pushState({ app: 'neshtv-base', t: Date.now() }, '');
    } catch {}

    const handlePopState = (e: PopStateEvent) => {
      // Re-prime state immediately so subsequent presses don't close the WebView
      try {
        window.history.pushState({ app: 'neshtv-step', t: Date.now() }, '');
      } catch {}

      triggerBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [triggerBack]);

  const simulateKey = useCallback((key: string) => {
    const active = document.activeElement as HTMLElement;

    switch (key) {
      case 'ArrowUp':
        handleSpatialMove('up');
        break;
      case 'ArrowDown':
        handleSpatialMove('down');
        break;
      case 'ArrowLeft':
        handleSpatialMove('left');
        break;
      case 'ArrowRight':
        handleSpatialMove('right');
        break;
      case 'Enter':
      case 'Select':
        if (active) {
          active.click();
        }
        break;
      case 'Escape':
      case 'Backspace':
      case 'Back':
      case 'GoBack':
        triggerBack();
        break;
      case 'Home':
        window.dispatchEvent(new CustomEvent('nesh:home'));
        break;
      case 'Menu':
        window.dispatchEvent(new CustomEvent('nesh:menu'));
        break;
      case 'MediaPlayPause':
        window.dispatchEvent(new CustomEvent('nesh:playpause'));
        break;
      default:
        break;
    }
  }, [handleSpatialMove, triggerBack]);

  // Global physical remote control keydown listener for Smart TV / TV Box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Handle physical Android TV / TV Box Back button (KeyCode 4 / 27 / Backspace / Escape)
      if (
        e.key === 'Escape' ||
        e.key === 'Back' ||
        e.key === 'GoBack' ||
        e.keyCode === 4 ||
        e.keyCode === 27 ||
        (e.key === 'Backspace' && !isInput)
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerBack();
        return;
      }

      if (isInput) {
        if (e.key === 'Enter') return;
        if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
      }

      // Android TV Box D-Pad: Up (19/38), Down (20/40), Left (21/37), Right (22/39)
      // Enter / DPAD Center (23/66/13)
      // Media keys: 85/179 (PlayPause), 126 (Play), 127 (Pause)
      const isArrowKey =
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) ||
        [19, 20, 21, 22, 37, 38, 39, 40].includes(e.keyCode);

      const isSelectKey =
        ['Enter', 'Select'].includes(e.key) ||
        [13, 23, 66].includes(e.keyCode);

      const isMediaKey =
        ['MediaPlayPause', 'MediaPlay', 'MediaPause'].includes(e.key) ||
        [85, 126, 127, 179].includes(e.keyCode);

      if (isArrowKey) {
        e.preventDefault();
        const now = Date.now();
        if (now - lastKeyTimeRef.current < 45) return;
        lastKeyTimeRef.current = now;

        if (e.key === 'ArrowUp' || e.keyCode === 19 || e.keyCode === 38) handleSpatialMove('up');
        else if (e.key === 'ArrowDown' || e.keyCode === 20 || e.keyCode === 40) handleSpatialMove('down');
        else if (e.key === 'ArrowLeft' || e.keyCode === 21 || e.keyCode === 37) handleSpatialMove('left');
        else if (e.key === 'ArrowRight' || e.keyCode === 22 || e.keyCode === 39) handleSpatialMove('right');
        return;
      }

      if (isSelectKey) {
        const active = document.activeElement as HTMLElement;
        if (active && typeof active.click === 'function') {
          active.click();
        }
        return;
      }

      if (isMediaKey) {
        e.preventDefault();
        simulateKey('MediaPlayPause');
        return;
      }

      // Menu key (KeyCode 82)
      if (e.key === 'ContextMenu' || e.keyCode === 82) {
        e.preventDefault();
        simulateKey('Menu');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleSpatialMove, simulateKey, triggerBack]);

  return (
    <RemoteNavigationContext.Provider
      value={{
        deviceMode,
        setDeviceMode,
        focusedId,
        setFocusedId,
        simulateKey,
        activeScreen,
        setActiveScreen,
        registerBackHandler,
        triggerBack,
      }}
    >
      {children}
    </RemoteNavigationContext.Provider>
  );
};

export const useRemoteNavigation = () => {
  const context = useContext(RemoteNavigationContext);
  if (!context) {
    throw new Error('useRemoteNavigation must be used within a RemoteNavigationProvider');
  }
  return context;
};
