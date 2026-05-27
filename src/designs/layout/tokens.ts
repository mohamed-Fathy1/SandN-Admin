/**
 * Brand accent in raw RGB triplet form so callers can compose
 * arbitrary-alpha rgba() strings without hardcoding the hue.
 */
export const ACCENT_RGB = '191, 60, 104' as const;

/**
 * Build an rgba string from the brand accent at a given alpha (0–1).
 * Use sparingly — prefer A.accent / A.accentSoft / A.accentGlow tokens
 * or the CSS variables --color-accent-soft / --shadow-* when possible.
 */
export const accentAlpha = (alpha: number): string =>
  `rgba(${ACCENT_RGB}, ${alpha})`;

export const A = {
  // Surfaces
  bg: '#F8F5F3',
  bgCard: '#FFFFFF',
  bgAlt: '#F2EAE7',
  bgSidebar: '#1C0B12',
  bgSidebarHover: 'rgba(255, 255, 255, 0.06)',
  bgSidebarActive: 'rgba(191, 60, 104, 0.16)',

  // Brand accent
  accent: '#BF3C68',
  accentHover: '#A8305A',
  accentSoft: 'rgba(191, 60, 104, 0.08)',
  accentGlow: 'rgba(191, 60, 104, 0.18)',

  // Functional status
  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.08)',
  warning: '#D97706',
  warningSoft: 'rgba(217, 119, 6, 0.10)',
  success: '#059669',
  successSoft: 'rgba(5, 150, 105, 0.08)',
  info: '#2563EB',
  infoSoft: 'rgba(37, 99, 235, 0.08)',

  // Text
  text: '#1A1A1A',
  textMuted: '#6B5E5E',
  textLight: '#9B8E8E',
  textInverted: '#FFFFFF',
  textSidebarActive: '#FFFFFF',
  textSidebarInactive: 'rgba(255, 255, 255, 0.62)',

  // Borders / focus
  border: 'rgba(64, 20, 35, 0.08)',
  borderMedium: 'rgba(64, 20, 35, 0.14)',
  borderStrong: 'rgba(64, 20, 35, 0.22)',
  focusRing: 'rgba(191, 60, 104, 0.45)',

  // Shadows
  shadow: '0 2px 12px rgba(64, 20, 35, 0.06)',
  shadowMd: '0 4px 24px rgba(64, 20, 35, 0.10)',
  shadowLg: '0 12px 40px rgba(64, 20, 35, 0.14)',
  shadowOverlay: '0 24px 64px rgba(0, 0, 0, 0.24)',
  shadowInset: 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(64,20,35,0.04)',
  shadowGlow: '0 0 0 6px rgba(191,60,104,0.10)',

  // Surface treatments
  bgVignette: 'linear-gradient(180deg, rgba(64,20,35,0) 0%, rgba(64,20,35,0.04) 100%)',
  glass: {
    bg: 'rgba(255,255,255,0.72)',
    blur: 'blur(16px)',
    border: 'rgba(64,20,35,0.08)',
  },

  // Order status palette
  status: {
    ordered: { fg: '#1E40AF', bg: 'rgba(37, 99, 235, 0.12)' },
    confirmed: { fg: '#6D28D9', bg: 'rgba(139, 92, 246, 0.12)' },
    under_review: { fg: '#B45309', bg: 'rgba(217, 119, 6, 0.12)' },
    shipped: { fg: '#0E7490', bg: 'rgba(6, 182, 212, 0.12)' },
    delivered: { fg: '#065F46', bg: 'rgba(5, 150, 105, 0.14)' },
    cancelled: { fg: '#991B1B', bg: 'rgba(220, 38, 38, 0.12)' },
    deleted: { fg: '#4B5563', bg: 'rgba(107, 114, 128, 0.14)' },
  },

  // Typography
  fontDisplay: '"Cormorant Garamond", serif',
  fontBody: '"Nunito Sans", sans-serif',
  fontBodyAr: '"Tajawal", "Nunito Sans", sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, monospace',

  // Radii
  radius: '12px',
  radiusSm: '8px',
  radiusLg: '20px',
  radiusPill: '999px',

  // Spacing (px)
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  },

  // Z-index
  z: {
    base: 0,
    sticky: 10,
    dropdown: 50,
    sheet: 60,
    dialog: 70,
    toast: 80,
    tooltip: 90,
  },

  // Animation
  easeOut: [0.22, 1, 0.36, 1] as const,
  spring: { type: 'spring' as const, stiffness: 380, damping: 28 },
  springSoft: { type: 'spring' as const, stiffness: 280, damping: 26 },
  springSnappy: { type: 'spring' as const, stiffness: 420, damping: 28 },
  motionDuration: { fast: 0.18, base: 0.28, slow: 0.45 },
} as const;

export type StatusKey = keyof typeof A.status;
