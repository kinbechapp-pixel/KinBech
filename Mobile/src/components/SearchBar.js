import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';
import { useTheme, useThemedStyles } from '../theme';

const createStyles = (colors) => ({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
});

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search for things you love...',
  onSubmitEditing,
  onFilterPress,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
        style={styles.input}
      />
      {onFilterPress ? (
        <Pressable onPress={onFilterPress} hitSlop={8}>
          <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
