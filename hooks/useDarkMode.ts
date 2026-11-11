import { useState, useEffect, useCallback } from 'react';

export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDark));
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(prev => !prev), []);
  return [isDark, toggle];
}
