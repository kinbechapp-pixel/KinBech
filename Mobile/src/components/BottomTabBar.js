import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles } from '../theme';

const ICONS = {
  Home: { outline: 'home-outline', filled: 'home' },
  Categories: { outline: 'compass-outline', filled: 'compass' },
  Post: { outline: 'add', filled: 'add' },
  Chats: { outline: 'chatbubble-ellipses-outline', filled: 'chatbubble-ellipses' },
  Profile: { outline: 'person-outline', filled: 'person' },
};

const createStyles = (colors) => ({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  sellButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  label: {
    fontSize: 11,
    color: colors.tabBarInactive,
  },
  labelActive: {
    color: colors.link,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.badge,
  },
});

export default function BottomTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  // Guard against undefined state
  if (!state?.routes) {
    return null;
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {(state.routes || []).map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isPost = route.name === 'Post';
        const icon = ICONS[route.name] || { outline: 'ellipse-outline', filled: 'ellipse' };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isPost) {
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item}>
              <View style={[styles.sellButton, { backgroundColor: colors.primary, shadowColor: colors.glow }]}>
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item}>
            <View>
              <Ionicons
                name={isFocused ? icon.filled : icon.outline}
                size={22}
                color={isFocused ? colors.link : colors.tabBarInactive}
              />
              {route.name === 'Chats' ? <View style={styles.dot} /> : null}
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
