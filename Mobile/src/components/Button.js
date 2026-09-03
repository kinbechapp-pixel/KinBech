import { Pressable, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../theme';

const createStyles = (colors) => ({
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.link,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineLabel: {
    color: colors.link,
  },
});

export default function Button({ title, onPress, variant = 'primary', disabled }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isOutline = variant === 'outline';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}
    >
      {isOutline ? (
        <View style={[styles.button, styles.outline]}>
          <Text style={[styles.label, styles.outlineLabel]}>{title}</Text>
        </View>
      ) : (
        <View style={[styles.button, styles.primary]}>
          <Text style={styles.label}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
