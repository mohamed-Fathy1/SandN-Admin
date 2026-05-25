import { create } from 'zustand';

interface UiStore {
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  /** Per-pathname breadcrumb label override for the trailing crumb. */
  crumbOverrides: Record<string, string>;
  setPaletteOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  togglePalette: () => void;
  toggleShortcuts: () => void;
  setCrumbOverride: (pathname: string, label: string | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  paletteOpen: false,
  shortcutsOpen: false,
  crumbOverrides: {},
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  toggleShortcuts: () => set((s) => ({ shortcutsOpen: !s.shortcutsOpen })),
  setCrumbOverride: (pathname, label) =>
    set((s) => {
      const next = { ...s.crumbOverrides };
      if (label) next[pathname] = label;
      else delete next[pathname];
      return { crumbOverrides: next };
    }),
}));
