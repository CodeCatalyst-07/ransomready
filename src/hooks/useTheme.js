import { useLayoutEffect, useState } from 'react';

const storageKey = 'ransomready-theme';

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(storageKey);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  } catch {
    // Storage may be unavailable; the OS preference still gives a useful default.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  // Apply before painting so the page and toggle always agree about the theme.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // The toggle works for this session even if persistence is blocked.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => current === 'light' ? 'dark' : 'light');
  }

  return { theme, toggleTheme };
}
