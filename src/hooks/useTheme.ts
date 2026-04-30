import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Récupère le thème sauvegardé ou utilise le sombre par défaut
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    // Applique le thème sur le document
    document.documentElement.setAttribute(
      'data-theme',
      theme === 'light' ? 'light' : ''
    );
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
