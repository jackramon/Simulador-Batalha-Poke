import { useState, useEffect, useCallback } from 'react';
import { lerItem, gravarItem } from '../utils/safeStorage';

export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return lerItem('darkMode') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    gravarItem('darkMode', String(isDark));
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(prev => !prev), []);
  return [isDark, toggle];
}
