export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceHigh: string;
  border: string;
  accent: string;
  accentDim: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  danger: string;
}

export const DARK_COLORS: ThemeColors = {
  bg: '#0A0A1A',
  surface: '#12122A',
  surfaceHigh: '#1A1A35',
  border: '#1E1E3A',
  accent: '#1ED760',
  accentDim: '#1ED76022',
  textPrimary: '#FFFFFF',
  textSecondary: '#9090A8',
  textMuted: '#4A4A6A',
  danger: '#FF4D6A',
};

export const LIGHT_COLORS: ThemeColors = {
  bg: '#F4F4F8',
  surface: '#FFFFFF',
  surfaceHigh: '#EAEAF2',
  border: '#DCDCEA',
  accent: '#1DB954',
  accentDim: '#1DB95418',
  textPrimary: '#0D0D1F',
  textSecondary: '#555575',
  textMuted: '#9898B0',
  danger: '#FF4D6A',
};

// kept for any legacy references
export const COLORS = DARK_COLORS;

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const FONT = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 26,
} as const;
