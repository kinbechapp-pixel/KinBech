import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../components/EmptyState';
import FilterBottomSheet from '../components/FilterBottomSheet';
import { useSharedTransition } from '../context/SharedTransitionContext';
import { openItemDetail } from '../navigation/helpers';
import { api } from '../services/api';
import { categoryIcon, formatPrice } from '../utils/listing';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

const SORT_ORDER = [
  { label: 'Nearest First', key: 'distance' },
  { label: 'Most Relevant', key: 'relevance' },
  { label: 'Newest First', key: 'newest' },
  { label: 'Price: Low to High', key: 'price-low' },
  { label: 'Price: High to Low', key: 'price-high' },
];

const SORT_KEY_TO_LABEL = SORT_ORDER.reduce((acc, s) => {
  acc[s.key] = s.label;
  return acc;
}, {});

function distanceLabel(km) {
  if (km == null || !Number.isFinite(km)) {
    return null;
  }
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function SearchResultsScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { tryBeginNavigation } = useSharedTransition();

  const [query, setQuery] = useState(route?.params?.query || '');
  const [favorites, setFavorites] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState(route?.params?.sort || 'distance');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
  const [hasLocationPerm, setHasLocationPerm] = useState(false);

  const [filters, setFilters] = useState({
    category: route?.params?.category,
    condition: route?.params?.condition,
    minPrice: route?.params?.minPrice,
    maxPrice: route?.params?.maxPrice,
    radiusKm: route?.params?.radiusKm ?? null,
    distance: route?.params?.distance || 'All Distances',
    priceMin: route?.params?.priceMin,
    priceMax: route?.params?.priceMax,
    sortBy: SORT_KEY_TO_LABEL[sortKey] || 'Nearest First',
  });

  const sortLabel = SORT_KEY_TO_LABEL[sortKey] || 'Nearest First';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (status === 'granted') {
          setHasLocationPerm(true);
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }).catch(() => null);
          if (!active) return;
          if (loc?.coords) {
            setUserCoords({
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            });
          }
        } else {
          setHasLocationPerm(false);
        }
      } catch (err) {
        if (active) setHasLocationPerm(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const queryParams = useMemo(() => {
    const params = {};
    if (query && query.trim()) params.q = query.trim();
    if (filters.category && filters.category !== 'All' && filters.category !== 'More') {
      params.category = filters.category;
    }
    if (filters.condition && filters.condition !== 'All') {
      params.condition = filters.condition;
    }
    const minPrice = filters.priceMin ?? filters.minPrice;
    const maxPrice = filters.priceMax ?? filters.maxPrice;
    if (minPrice != null && minPrice !== '') params.minPrice = Number(minPrice);
    if (maxPrice != null && maxPrice !== '') params.maxPrice = Number(maxPrice);
    if (filters.radiusKm != null && Number(filters.radiusKm) > 0) {
      params.radius = Number(filters.radiusKm);
    }
    if (userCoords?.lat != null && userCoords?.lng != null) {
      params.lat = userCoords.lat;
      params.lng = userCoords.lng;
    }
    params.sort = sortKey;
    return params;
  }, [query, filters, sortKey, userCoords]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await api.searchListings(queryParams);
      if (!active) return;
      setLoading(false);
      if (error) {
        console.error('Failed to load search results:', error);
        setListings([]);
      } else {
        setListings(data?.listings || []);
      }
    })();
    return () => {
      active = false;
    };
  }, [queryParams]);

  const cycleSort = () => {
    const idx = SORT_ORDER.findIndex((s) => s.key === sortKey);
    const next = SORT_ORDER[(idx + 1) % SORT_ORDER.length];
    setSortKey(next.key);
  };

  const toggleFavorite = async (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
    await api.toggleWishlist(id);
  };

  const filterInitial = {
    category: filters.category ?? 'All',
    condition: filters.condition ?? 'All',
    distance: filters.distance ?? 'All Distances',
    sortBy: sortLabel,
    priceMin: filters.priceMin ?? filters.minPrice ?? 5000,
    priceMax: filters.priceMax ?? filters.maxPrice ?? 100000,
  };

  return (
    <View style={styles.root}>
      <ThemeStatusBar />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            placeholder="Search for things you love..."
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <Pressable style={styles.filterIconBtn} onPress={() => setFiltersOpen(true)}>
          <Ionicons name="options-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <Pressable
          style={[styles.chip, filters.radiusKm != null && styles.chipActive]}
          onPress={() => setFiltersOpen(true)}
        >
          <Ionicons name="location-outline" size={15} color={filters.radiusKm != null ? colors.onPrimary : colors.text} />
          <Text style={[styles.chipText, filters.radiusKm != null && styles.chipTextActive]}>
            {filters.radiusKm != null ? `${filters.radiusKm} km` : 'Distance'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={filters.radiusKm != null ? colors.onPrimary : colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.chip, filters.category && filters.category !== 'All' && styles.chipActive]}
          onPress={() => setFiltersOpen(true)}
        >
          <Ionicons name="grid-outline" size={15} color={filters.category && filters.category !== 'All' ? colors.onPrimary : colors.text} />
          <Text style={[styles.chipText, filters.category && filters.category !== 'All' && styles.chipTextActive]}>
            {filters.category && filters.category !== 'All' ? filters.category : 'Category'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={filters.category && filters.category !== 'All' ? colors.onPrimary : colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.chip, filters.condition && filters.condition !== 'All' && styles.chipActive]}
          onPress={() => setFiltersOpen(true)}
        >
          <Ionicons name="shield-checkmark-outline" size={15} color={filters.condition && filters.condition !== 'All' ? colors.onPrimary : colors.text} />
          <Text style={[styles.chipText, filters.condition && filters.condition !== 'All' && styles.chipTextActive]}>
            {filters.condition && filters.condition !== 'All' ? filters.condition : 'Condition'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={filters.condition && filters.condition !== 'All' ? colors.onPrimary : colors.textMuted} />
        </Pressable>

        <Pressable style={styles.chip} onPress={() => setFiltersOpen(true)}>
          <Ionicons name="pricetag-outline" size={15} color={colors.text} />
          <Text style={styles.chipText}>Price</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </Pressable>
      </ScrollView>

      <View style={styles.resultsRow}>
        <Text style={styles.resultsCount}>
          {`${listings.length} results found`}
        </Text>
        <Pressable style={styles.sortBtn} onPress={cycleSort}>
          <Ionicons name="swap-vertical" size={15} color={colors.text} />
          <Text style={styles.sortText} numberOfLines={1}>
            {sortLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </Pressable>
      </View>

      {!hasLocationPerm && (
        <View style={styles.locationHint}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.locationHintText}>
            Enable location to see nearest listings first
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {listings.length > 0 && (
          <View style={styles.grid}>
            {(listings || []).map((listing) => {
              const photo = listing.photos?.[0];
              const dLabel = distanceLabel(listing.distanceKm);
              const isFav = !!favorites[listing.id];
              return (
                <Pressable
                  key={listing.id}
                  style={styles.card}
                  onPress={() =>
                    tryBeginNavigation(listing.id, () =>
                      openItemDetail(navigation, { listingId: listing.id, item: listing, sharedId: listing.id })
                    )
                  }
                >
                  <View style={[styles.thumb, { backgroundColor: colors.iconBackground }]}>
                    {photo ? (
                      <Image
                        source={{ uri: photo }}
                        style={styles.thumbImage}
                        resizeMode="cover"
                        sharedTransitionTag={`item.${listing.id}.photo`}
                      />
                    ) : (
                      <Ionicons
                        name={categoryIcon(listing.category)}
                        size={40}
                        color={colors.primary}
                        sharedTransitionTag={`item.${listing.id}.photo`}
                      />
                    )}
                    <Pressable
                      style={styles.heartBtn}
                      hitSlop={8}
                      onPress={() => toggleFavorite(listing.id)}
                    >
                      <Ionicons
                        name={isFav ? 'heart' : 'heart-outline'}
                        size={18}
                        color={isFav ? colors.danger : colors.text}
                      />
                    </Pressable>
                    <View style={styles.cardBadges}>
                      {dLabel ? (
                        <View style={styles.distanceBadge}>
                          <Ionicons name="navigate" size={10} color={colors.onPrimary} />
                          <Text style={styles.distanceBadgeText}>{dLabel}</Text>
                        </View>
                      ) : null}
                      {listing.views != null ? (
                        <View style={styles.viewsBadge}>
                          <Ionicons name="eye" size={10} color="#fff" />
                          <Text style={styles.viewsBadgeText}>
                            {listing.views >= 1000 ? `${(listing.views / 1000).toFixed(1)}k` : listing.views}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1} sharedTransitionTag={`item.${listing.id}.title`}>
                      {listing.title}
                    </Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {listing.condition}
                    </Text>
                    <Text style={styles.cardPrice} sharedTransitionTag={`item.${listing.id}.price`}>{formatPrice(listing.price)}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {listing.location || 'Unknown area'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {listings.length === 0 ? (
          <EmptyState
            compact
            icon="search-outline"
            title="No results found"
            body="Try another search or change filters to find what you need."
          />
        ) : null}
      </ScrollView>

      <FilterBottomSheet
        visible={filtersOpen}
        initial={filterInitial}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => {
          setFilters((prev) => ({
            ...prev,
            category: next.category,
            condition: next.condition,
            minPrice: next.priceMin,
            maxPrice: next.priceMax,
            priceMin: next.priceMin,
            priceMax: next.priceMax,
            radiusKm: next.radiusKm ?? null,
            distance: next.distance ?? prev.distance,
            sortBy: next.sortBy,
          }));
          if (next.sortKey) {
            setSortKey(next.sortKey);
          }
          setFiltersOpen(false);
        }}
      />
    </View>
  );
}

const createStyles = (colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  filterIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    alignSelf: 'center',
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.textMuted,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '55%',
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  locationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primarySoft || colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  locationHintText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardBadges: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'column',
    gap: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  viewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardPrice: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '800',
    color: colors.price,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 3,
  },
  locationText: {
    fontSize: 10,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    marginTop: 8,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 13,
    color: colors.primary,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  loadingRow: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
