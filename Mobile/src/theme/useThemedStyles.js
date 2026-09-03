import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';
import { colors as defaultColors } from './colors';

/**
 * Build StyleSheet from theme colors. Recomputes when light/dark mode changes.
 * @template T
 * @param {(colors: typeof defaultColors) => T} factory
 * @returns {T}
 */
export function useThemedStyles(factory) {
  const { colors } = useTheme();
  const safeColors = colors || defaultColors;
  return useMemo(() => StyleSheet.create(factory(safeColors) || {}), [safeColors, factory]);
}
