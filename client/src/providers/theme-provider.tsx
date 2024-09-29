import { useEffect, createContext, useContext, ReactNode, useState } from 'react';

export enum Theme {
  Dark = 'dark',
  Light = 'light',
}

const THEME_STORAGE_KEY = 'theme-state';

const ValidTheme = (theme?: Theme | string): theme is Theme => (
  theme === Theme.Dark || theme === Theme.Light
);

const useThemeProvider = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return storedTheme && ValidTheme(storedTheme) ? storedTheme : Theme.Dark;
  });

  useEffect(() => {
    if (ValidTheme(theme)) {
      document.documentElement.setAttribute('theme', theme);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } else {
      setTheme(Theme.Dark);
    }
  }, [theme]);

  return {
    theme,
    changeTheme: setTheme,
  };
};

export type ThemeContextType = ReturnType<typeof useThemeProvider>;

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const themeProvider = useThemeProvider();

  return (
    <ThemeContext.Provider value={themeProvider}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
