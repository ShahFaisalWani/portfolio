import { useEffect, createContext, useContext, ReactNode, useState } from 'react';

// Theme enum remains the same
export enum Theme {
  Dark = 'dark',
  Light = 'light',
}

// Local storage key for storing the theme
const THEME_STORAGE_KEY = 'theme-state';

// Validates if the theme is valid (Dark or Light)
const ValidTheme = (theme?: Theme | string): theme is Theme => (
  theme === Theme.Dark || theme === Theme.Light
);

// Custom hook for managing theme and local storage
const useThemeProvider = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Load initial theme from local storage or fallback to Dark
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return storedTheme && ValidTheme(storedTheme) ? storedTheme : Theme.Dark;
  });

  useEffect(() => {
    // Update theme in local storage and document attribute when it changes
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

// Create a React context for theme management
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider component that wraps children with the theme context
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const themeProvider = useThemeProvider();

  return (
    <ThemeContext.Provider value={themeProvider}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context in other components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
