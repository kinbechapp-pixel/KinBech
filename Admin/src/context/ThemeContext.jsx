import { createContext, useContext, useState, useEffect } from 'react';
import { lightColors, darkColors } from '../theme/colors';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [colors, setColors] = useState(lightColors);

  useEffect(() => {
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      setColors(savedTheme === 'dark' ? darkColors : lightColors);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Check system preference
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      setColors(darkColors);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setColors(newTheme === 'dark' ? darkColors : lightColors);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);