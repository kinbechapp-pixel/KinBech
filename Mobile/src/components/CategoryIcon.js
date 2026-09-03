import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../theme';

const createStyles = (colors) => ({
  wrap: {
    width: 64,
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

export default function CategoryIcon({
  label,
  emoji = '📦',
  icon,
  color,
  onPress,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const iconBackground = color ?? colors.primary ?? '#5B39C6';
  const onPrimaryColor = colors.onPrimary ?? colors.white ?? '#FFFFFF';

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>
        {icon ? (
          <Ionicons name={icon} size={22} color={onPrimaryColor} />
        ) : (
          <Text style={styles.emoji}>{emoji}</Text>
        )}
      </View>
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}
