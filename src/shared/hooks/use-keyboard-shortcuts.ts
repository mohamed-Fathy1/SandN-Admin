import { useEffect } from 'react';

export interface Shortcut {
  /** Single character to match (case-insensitive), e.g. 'k', 'b'. */
  key: string;
  /** Require Cmd on macOS / Ctrl elsewhere. */
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (event: KeyboardEvent) => void;
  /** When true, the shortcut still fires while the user is typing in an input. */
  allowInInput?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const typing = isTypingTarget(event.target);
      for (const s of shortcuts) {
        if (event.key.toLowerCase() !== s.key.toLowerCase()) continue;
        const mod = event.metaKey || event.ctrlKey;
        if (Boolean(s.mod) !== mod) continue;
        if (Boolean(s.shift) !== event.shiftKey) continue;
        if (Boolean(s.alt) !== event.altKey) continue;
        if (typing && !s.allowInInput) continue;
        event.preventDefault();
        s.handler(event);
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
}
