import { StatusBar } from 'expo-status-bar';
import { useTheme } from './ThemeContext';
import { colors as defaultColors } from './colors';

/** Status bar that follows the active theme. Use `variant="header"` on gradient screens. */
export function ThemeStatusBar({ variant = 'default' }) {
  const { isDarkMode } = useTheme();
  const style = isDarkMode ? 'light' : 'dark';
  return <StatusBar style={style} />;
}
