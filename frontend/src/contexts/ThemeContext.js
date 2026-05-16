import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const THEMES = {
  light: { label: 'Light', class: '' },
  moonlight: { label: 'Moonlight', class: 'moonlight' },
  dark: { label: 'Dark', class: 'dark' },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('aura-theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'moonlight', 'dark');
    if (THEMES[theme].class) {
      root.classList.add(THEMES[theme].class);
    }
    localStorage.setItem('aura-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    const keys = Object.keys(THEMES);
    const next = keys[(keys.indexOf(theme) + 1) % keys.length];
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be within ThemeProvider');
  return ctx;
}
