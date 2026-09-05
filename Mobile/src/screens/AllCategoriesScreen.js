import { useState, useEffect } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../components/EmptyState';
import { ROUTES } from '../navigation/helpers';
import { api } from '../services/api';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

/**
 * Resolve color references (e.g., 'colors.iconBackground') to actual color values
 * @param {string} colorRef - Color reference string or direct color value
 * @param {object} colors - Theme colors object
 * @returns {string} Resolved color value
 */
function resolveColor(colorRef, colors) {
  if (typeof colorRef === 'string' && colorRef.startsWith('colors.')) {
    const colorKey = colorRef.replace('colors.', '');
    return colors[colorKey] || colorRef;
  }
  return colorRef;
}

const DEFAULT_CATEGORIES = [
  { label: 'Mobiles', icon: 'phone-portrait-outline', colorKey: 'category.mobiles', iconSet: 'ionicons' },
  { label: 'Laptops', icon: 'laptop-outline', colorKey: 'category.laptops', iconSet: 'ionicons' },
  { label: 'Electronics', icon: 'headset-outline', colorKey: 'category.electronics', iconSet: 'ionicons' },
  { label: 'Furniture', icon: 'bed-outline', colorKey: 'category.furniture', iconSet: 'ionicons' },
  { label: 'Vehicles', icon: 'car-outline', colorKey: 'category.vehicles', iconSet: 'ionicons' },
  { label: 'Fashion', icon: 'shirt-outline', colorKey: 'category.fashion', iconSet: 'ionicons' },
  { label: 'Sports & Fitness', icon: 'bicycle-outline', colorKey: 'category.sports', iconSet: 'ionicons' },
];

export default function AllCategoriesScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await api.getListings();
      if (!active) return;
      setLoading(false);
      if (!error && data?.listings) {
        // Count items per category
        const categoryCounts = {};
        data.listings.forEach(listing => {
          if (listing.category) {
            categoryCounts[listing.category] = (categoryCounts[listing.category] || 0) + 1;
          }
        });

        // Get unique categories from listings that aren't in DEFAULT_CATEGORIES
        const uniqueCategories = [...new Set(data.listings.map(l => l.category).filter(Boolean))];
        const extraCategories = uniqueCategories.filter(
          cat => !DEFAULT_CATEGORIES.some(c => c.label === cat)
        );

        // Start with all default categories with their counts
        const allCategories = DEFAULT_CATEGORIES.map(category => ({
          ...category,
          count: categoryCounts[category.label] || 0,
          bg: `colors.${category.colorKey}`,
          tint: `colors.${category.colorKey}`
        }));

        // Add any extra categories from listings
        const extraWithCounts = extraCategories.map(category => ({
          label: category,
          icon: 'pricetag-outline',
          colorKey: 'category.more',
          iconSet: 'ionicons',
          count: categoryCounts[category] || 0,
          bg: 'colors.category.more',
          tint: 'colors.category.more'
        }));

        setCategories([...allCategories, ...extraWithCounts]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Guard against undefined colors
  if (!colors) {
    return null;
  }

  // Resolve category colors dynamically
  const resolvedCategories = (categories || []).map(category => ({
    ...category,
    bg: resolveColor(`colors.${category.colorKey}`, colors),
    tint: resolveColor(`colors.${category.colorKey}`, colors)
  }));

  const filtered = resolvedCategories.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ThemeStatusBar variant="header" />
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.onGradient} />
        </Pressable>
        <Text style={styles.headerTitle}>All Categories</Text>
        <View style={styles.back} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories..."
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
          />
        </View>

        {filtered.length > 0 ? (
          <View style={styles.grid}>
            {(filtered || []).map((item) => (
              <Pressable
                key={item.label}
                style={styles.card}
                onPress={() => navigation.navigate(ROUTES.EXPLORE, { category: item.label })}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                  {item.iconSet === 'mci' ? (
                    <MaterialCommunityIcons name={item.icon} size={26} color={item.tint} />
                  ) : (
                    <Ionicons name={item.icon} size={24} color={item.tint} />
                  )}
                </View>
                <Text style={styles.cardLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.cardCount}>{item.count || 0} items</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState
            compact
            icon="grid-outline"
            title="No categories yet"
            body="Categories appear here when people start posting listings."
          />
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.onGradient,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '31.5%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    marginBottom: 14,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  cardCount: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
});
