import React, { createContext, useContext } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  colors: {
    primary: '#8b5cf6',
    secondary: '#1f2937',
    accent: '#3b82f6',
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff'
  }
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  const value = {
    theme,
    setTheme,
    colors: {
      primary: '#8b5cf6',
      secondary: '#1f2937',
      accent: '#3b82f6',
      background: '#000000',
      surface: '#1a1a1a',
      text: '#ffffff'
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
