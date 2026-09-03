import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSharedTransition } from '../context/SharedTransitionContext';
import { openItemDetail, ROUTES } from '../navigation/helpers';
import { api } from '../services/api';
import { attachDistanceToCard, toCardItem } from '../utils/listing';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Skeleton, ProductCardSkeleton } from '../components/SkeletonLoader';

const DEFAULT_CATEGORIES = [
  { label: 'Mobiles', icon: 'phone-portrait-outline', tint: '#5B39C6' },
  { label: 'Laptops', icon: 'laptop-outline', tint: '#16A34A' },
  { label: 'Electronics', icon: 'headset-outline', tint: '#DB2777' },
  { label: 'Furniture', icon: 'file-tray-stacked-outline', tint: '#059669' },
  { label: 'Vehicles', icon: 'car-outline', tint: '#4F46E5' },
  { label: 'Fashion', icon: 'shirt-outline', tint: '#EC4899' },
  { label: 'Sports & Fitness', icon: 'bicycle-outline', tint: '#0D9488' },
];

const SIDEBAR_WIDTH = 92;
const GRID_GUTTER = 8;
const GRID_PADDING = 10;

export default function CategoryScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const initialCategory = route?.params?.category;

  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const paneAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(new Map()).current;
  const sidebarItemAnims = useRef(new Map()).current;

  const triggerPaneAnim = useCallback(() => {
    paneAnim.stopAnimation();
    paneAnim.setValue(0);
    Animated.timing(paneAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [paneAnim]);

  const getCardAnim = useCallback((id) => {
    if (!cardAnims.has(id)) {
      cardAnims.set(id, new Animated.Value(1));
    }
    return cardAnims.get(id);
  }, [cardAnims]);

  const getSidebarItemAnim = useCallback((label) => {
    if (!sidebarItemAnims.has(label)) {
      sidebarItemAnims.set(label, new Animated.Value(1));
    }
    return sidebarItemAnims.get(label);
  }, [sidebarItemAnims]);

  const triggerCardsAnim = useCallback((itemIds) => {
    const toClean = [];
    for (const [id, val] of cardAnims.entries()) {
      if (!itemIds.includes(id)) toClean.push(id);
      else val.stopAnimation();
    }
    for (const id of toClean) cardAnims.delete(id);

    Animated.stagger(35,
      itemIds.map((id, i) => {
        const anim = getCardAnim(id);
        anim.setValue(0);
        return Animated.timing(anim, {
          toValue: 1,
          duration: 260 + Math.min(i * 10, 120),
          easing: Easing.out(Easing.back(1.15)),
          useNativeDriver: true,
        });
      })
    ).start();
  }, [cardAnims, getCardAnim]);

  const handleCategoryChange = useCallback((label) => {
    setActiveCategory((curr) => {
      if (curr === label) return curr;
      return label;
    });
  }, []);

  useEffect(() => {
    if (activeCategory == null || loading) return;
    triggerPaneAnim();
    const ids = items.map((it) => it.id);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    triggerCardsAnim(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, loading]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        let coords = { lat: null, lng: null };
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
            }).catch(() => null);
            if (loc?.coords) {
              coords = {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
              };
            }
          }
        } catch (e) {
          // ignore
        }
        const { data, error } = await api.getListings(
          coords.lat != null && coords.lng != null
            ? { lat: coords.lat, lng: coords.lng }
            : {}
        );
        if (!active) return;
        if (error) {
          console.error('Failed to load listings:', error);
          setAllListings([]);
        } else {
          const raw = (data?.listings || []).map(toCardItem).filter(Boolean);
          const withDistance = raw.map((it) => attachDistanceToCard(it, coords, user?.id));
          setAllListings(withDistance);
        }
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const categories = useMemo(() => {
    const found = {};
    for (const it of allListings) {
      const name = it.category || it.listing?.category;
      if (name) found[name] = (found[name] || 0) + 1;
    }
    const fromListings = Object.keys(found).map((label) => {
      const preset = DEFAULT_CATEGORIES.find((c) => c.label === label);
      return {
        label,
        icon: preset?.icon || 'pricetag-outline',
        tint: preset?.tint || '#F59E0B',
        count: found[label],
      };
    });
    fromListings.sort((a, b) => b.count - a.count);
    const merged = [...fromListings];
    for (const preset of DEFAULT_CATEGORIES) {
      if (!merged.find((c) => c.label === preset.label)) {
        merged.push({ ...preset, count: 0 });
      }
    }
    return merged;
  }, [allListings]);

  useEffect(() => {
    if (activeCategory != null) return;
    if (initialCategory && categories.find((c) => c.label === initialCategory)) {
      setActiveCategory(initialCategory);
    } else if (categories.length > 0) {
      setActiveCategory(categories[0].label);
    }
  }, [categories, initialCategory, activeCategory]);

  const items = useMemo(() => {
    if (!activeCategory) return [];
    return allListings.filter(
      (it) => (it.category || it.listing?.category) === activeCategory
    );
  }, [allListings, activeCategory]);

  const activeMeta = categories.find((c) => c.label === activeCategory);
  const paneWidth = Math.max(windowWidth - SIDEBAR_WIDTH, 160);
  const cardWidth = Math.floor((paneWidth - GRID_PADDING * 2 - GRID_GUTTER) / 2);
  const photoHeight = Math.round(cardWidth * 0.85);

  const { tryBeginNavigation } = useSharedTransition();

  const openItem = (item) =>
    tryBeginNavigation(item.id, () =>
      openItemDetail(navigation, { listingId: item.id, item: item.listing, sharedId: item.id })
    );

  if (!colors) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]} edges={['top']}>
      <ThemeStatusBar variant="header" />
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable
          style={styles.backBtn}
          hitSlop={10}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.onGradient} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeMeta?.label || 'Categories'}
        </Text>
        <Pressable
          style={styles.searchBtn}
          hitSlop={10}
          onPress={() =>
            navigation.navigate(ROUTES.SEARCH_RESULTS, {
              category: activeCategory,
            })
          }
        >
          <Ionicons name="search" size={20} color={colors.onGradient} />
        </Pressable>
      </View>

      <View style={[styles.splitWrap, { backgroundColor: colors.background }]}>
        {loading ? (
          <View style={styles.split}>
            <View style={[styles.sidebar, { backgroundColor: colors.iconBackground }]}>
              <ScrollView
                contentContainerStyle={styles.sidebarContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <View key={i} style={styles.sideItem}>
                    <Skeleton width={36} height={36} borderRadius={12} />
                    <Skeleton width={40} height={10} borderRadius={4} />
                    <Skeleton width={20} height={9} borderRadius={4} />
                  </View>
                ))}
              </ScrollView>
            </View>
            <View style={styles.itemsPane}>
              <View style={styles.itemsHeader}>
                <Skeleton width={100} height={15} borderRadius={4} />
                <Skeleton width={22} height={20} borderRadius={10} />
              </View>
              <View style={styles.itemsGridWrap}>
                <View style={styles.itemsGrid}>
                  {[1, 2, 3, 4, 5, 6].map((i) => {
                    const skeletonCardWidth = Math.floor((Math.max(windowWidth - SIDEBAR_WIDTH, 160) - GRID_PADDING * 2 - GRID_GUTTER) / 2);
                    return <ProductCardSkeleton key={i} width={skeletonCardWidth} />;
                  })}
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.split}>
            <View style={[styles.sidebar, { backgroundColor: colors.iconBackground }]}>
              <ScrollView
                contentContainerStyle={styles.sidebarContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {categories.map((cat) => {
                  const isActive = cat.label === activeCategory;
                  const itemAnim = getSidebarItemAnim(cat.label);
                  return (
                    <Animated.View key={cat.label} style={{ transform: [{ scale: itemAnim }] }}>
                      <Pressable
                        style={[
                          styles.sideItem,
                          isActive && { backgroundColor: colors.background },
                        ]}
                        onPress={() => {
                          // Micro-animation for press
                          Animated.sequence([
                            Animated.timing(itemAnim, {
                              toValue: 0.95,
                              duration: 50,
                              useNativeDriver: true,
                            }),
                            Animated.timing(itemAnim, {
                              toValue: 1,
                              duration: 150,
                              useNativeDriver: true,
                            }),
                          ]).start();
                          handleCategoryChange(cat.label);
                        }}
                      >
                        {isActive && (
                          <View
                            style={[styles.sideIndicator, { backgroundColor: colors.primary }]}
                          />
                        )}
                        <View
                          style={[
                            styles.sideIcon,
                            {
                              backgroundColor: isActive
                                ? `${cat.tint}1F`
                                : colors.surface,
                            },
                          ]}
                        >
                          <Ionicons
                            name={cat.icon}
                            size={18}
                            color={isActive ? cat.tint : colors.textMuted}
                          />
                        </View>
                        <Text
                          numberOfLines={2}
                          style={[
                            styles.sideLabel,
                            isActive && {
                              color: colors.text,
                              fontWeight: '800',
                            },
                          ]}
                        >
                          {cat.label}
                        </Text>
                        <Text style={styles.sideCount}>
                          {cat.count || 0}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </ScrollView>
            </View>

            <Animated.View
              style={[
                styles.itemsPane,
                {
                  backgroundColor: colors.surface,
                  opacity: paneAnim,
                  transform: [
                    {
                      translateY: paneAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [14, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.itemsHeader}>
                <Text style={styles.itemsHeaderTitle} numberOfLines={1}>
                  {activeMeta?.label || 'Items'}
                </Text>
                <View style={styles.itemsBadge}>
                  <Text style={styles.itemsBadgeText}>{items.length}</Text>
                </View>
              </View>

              {items.length === 0 ? (
                <ScrollView
                  contentContainerStyle={styles.itemsEmptyWrap}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.itemsEmpty}>
                    <Ionicons
                      name="cube-outline"
                      size={48}
                      color={colors.textMuted}
                    />
                    <Text style={styles.itemsEmptyTitle}>No items yet</Text>
                    <Text style={styles.itemsEmptySub}>
                      Items in this category will appear here.
                    </Text>
                  </View>
                </ScrollView>
              ) : (
                <ScrollView
                  contentContainerStyle={styles.itemsGridWrap}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <View style={styles.itemsGrid}>
                    {items.map((it) => {
                      const a = getCardAnim(it.id);
                      return (
                        <Animated.View
                          key={it.id}
                          style={{
                            opacity: a,
                            transform: [
                              {
                                translateY: a.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [18, 0],
                                }),
                              },
                              {
                                scale: a.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.94, 1],
                                }),
                              },
                            ],
                          }}
                        >
                          <Pressable
                            style={[
                              styles.itemCard,
                              {
                                width: cardWidth,
                                backgroundColor: colors.surface,
                                marginBottom: GRID_GUTTER,
                              },
                            ]}
                            onPress={() => openItem(it)}
                          >
                        <View
                          style={[
                            styles.itemPhoto,
                            {
                              height: photoHeight,
                              backgroundColor: colors.iconBackground,
                            },
                          ]}
                        >
                          {it.photo ? (
                            <Image
                              source={{ uri: it.photo }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                              sharedTransitionTag={`item.${it.id}.photo`}
                            />
                          ) : (
                            <Ionicons
                              name={it.icon || 'cube-outline'}
                              size={28}
                              color={colors.textMuted}
                              sharedTransitionTag={`item.${it.id}.photo`}
                            />
                          )}
                        </View>
                        <View style={styles.itemBody}>
                          <Text numberOfLines={2} style={styles.itemTitle} sharedTransitionTag={`item.${it.id}.title`}>
                            {it.title}
                          </Text>
                          <Text numberOfLines={1} style={styles.itemPrice} sharedTransitionTag={`item.${it.id}.price`}>
                            {it.price}
                          </Text>
                          <View style={styles.itemMeta}>
                            {it.distanceLabel ? (
                              <View style={styles.itemMetaItem}>
                                <Ionicons
                                  name="navigate"
                                  size={9}
                                  color={colors.textMuted}
                                />
                                <Text numberOfLines={1} style={styles.itemMetaText}>
                                  {it.distanceLabel}
                                </Text>
                              </View>
                            ) : null}
                            {it.views != null && Number(it.views) >= 0 ? (
                              <View style={styles.itemMetaItem}>
                                <Ionicons
                                  name="eye"
                                  size={9}
                                  color={colors.textMuted}
                                />
                                <Text numberOfLines={1} style={styles.itemMetaText}>
                                  {it.views >= 1000
                                    ? `${(it.views / 1000).toFixed(1)}k`
                                    : it.views}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </Animated.View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.onGradient,
    textAlign: 'center',
  },
  splitWrap: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  split: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
  },
  sidebarContent: {
    paddingVertical: 6,
    paddingBottom: 24,
  },
  sideItem: {
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 4,
    minHeight: 90,
  },
  sideIndicator: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  sideIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
  },
  sideCount: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  itemsPane: {
    flex: 1,
    flexDirection: 'column',
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemsHeaderTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  itemsBadge: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  itemsEmptyWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  itemsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  itemsEmptyTitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  itemsEmptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  itemsGridWrap: {
    paddingBottom: 24,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    paddingTop: GRID_PADDING,
    justifyContent: 'space-between',
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  itemPhoto: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    padding: 8,
    gap: 2,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 15,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.price,
    marginTop: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  itemMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  itemMetaText: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
