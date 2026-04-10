import React, { createContext, useContext, useState } from 'react';
import { DARK_COLORS, LIGHT_COLORS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [isDark, setIsDark] = useState(true);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const toggleTheme = (): void => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
