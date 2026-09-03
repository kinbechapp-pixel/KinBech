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
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSharedTransition } from '../context/SharedTransitionContext';
import { openItemDetail, ROUTES } from '../navigation/helpers';
import { api } from '../services/api';
import { attachDistanceToCard, toCardItem } from '../utils/listing';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Skeleton, ProductCardSkeleton, SellerProfileCardSkeleton, CompactSellerCardSkeleton } from '../components/SkeletonLoader';
import SellerProfileCard from '../components/SellerProfileCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import pinnedStoresUtils from '../utils/pinnedStores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(200, SCREEN_WIDTH / 2.0);

const createStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exploreTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.onGradient,
    letterSpacing: -0.5,
  },
  exploreSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  searchWrap: {
    marginTop: -20,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sectionIcon: {
    marginRight: 6,
  },
  viewAll: {
    color: colors.link,
    fontWeight: '600',
    fontSize: 13,
  },
  pinnedSection: {
    marginTop: 16,
  },
  pinnedScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredSection: {
    marginTop: 24,
  },
  featuredScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  popularSection: {
    marginTop: 24,
  },
  popularScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  nearbySection: {
    marginTop: 24,
  },
  nearbyList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  nearbyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nearbyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  nearbyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nearbyRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nearbyRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  nearbyDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nearbyDistanceText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  searchTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  searchTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  searchTabTextActive: {
    color: colors.onPrimary,
  },
  searchResults: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginTop: 60,
  },
  searchContent: {
    flex: 1,
  },
});

// Mock seller data - this should be replaced with actual API calls
const MOCK_SELLERS = [
  {
    _id: 'seller1',
    name: 'Tech World',
    avatarUrl: null,
    coverImage: null,
    rating: 4.8,
    reviewsCount: 126,
    listingCount: 84,
    distance: 1.5,
    location: 'Kathmandu',
    verified: true,
    productGallery: [],
  },
  {
    _id: 'seller2',
    name: 'Mobile Hub',
    avatarUrl: null,
    coverImage: null,
    rating: 4.6,
    reviewsCount: 89,
    listingCount: 56,
    distance: 2.1,
    location: 'Lalitpur',
    verified: true,
    productGallery: [],
  },
  {
    _id: 'seller3',
    name: 'Furniture House',
    avatarUrl: null,
    coverImage: null,
    rating: 4.7,
    reviewsCount: 67,
    listingCount: 43,
    distance: 3.2,
    location: 'Bhaktapur',
    verified: false,
    productGallery: [],
  },
];

export default function ExploreScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { tryBeginNavigation } = useSharedTransition();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTab, setSearchTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
  const [pinnedStores, setPinnedStores] = useState([]);
  const [featuredSellers, setFeaturedSellers] = useState([]);
  const [popularSellers, setPopularSellers] = useState([]);
  const [nearbySellers, setNearbySellers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      };
      setUserCoords(coords);
      return coords;
    } catch (error) {
      console.log('Location error:', error);
      return null;
    }
  }, []);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const coords = await fetchCurrentLocation();
      
      // Skip API calls and use mock data directly for now since endpoints don't exist
      console.log('Using mock seller data for demo - API endpoints not yet implemented');
      const sellersWithDistance = MOCK_SELLERS.map(seller => ({
        ...seller,
        distance: coords ? seller.distance + (Math.random() * 2 - 1) : seller.distance,
      }));

      const featuredSellersData = sellersWithDistance.slice(0, 3);
      const popularSellersData = sellersWithDistance.sort((a, b) => b.rating - a.rating);
      const nearbySellersData = sellersWithDistance.sort((a, b) => a.distance - b.distance);

      setFeaturedSellers(featuredSellersData);
      setPopularSellers(popularSellersData);
      setNearbySellers(nearbySellersData);
      
      // Load pinned stores from AsyncStorage
      const pinned = await pinnedStoresUtils.getPinnedStores();
      setPinnedStores(pinned);

      // Trigger entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Failed to load sellers:', error);
      // Fall back to mock data on error
      console.log('Using mock data due to error');
      const sellersWithDistance = MOCK_SELLERS.map(seller => ({
        ...seller,
        distance: 0, // Default distance when location fails
      }));

      setFeaturedSellers(sellersWithDistance.slice(0, 3));
      setPopularSellers(sellersWithDistance.sort((a, b) => b.rating - a.rating));
      setNearbySellers(sellersWithDistance.sort((a, b) => a.distance - b.distance));
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentLocation, fadeAnim, slideAnim]);

  useFocusEffect(
    useCallback(() => {
      fetchSellers();
    }, [fetchSellers])
  );

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setLoading(true);

    try {
      // Try to fetch from API first
      const searchParams = {
        q: query.trim(),
        type: searchTab,
      };
      
      const searchRes = await api.searchSellers(searchParams);
      
      if (!searchRes.error && searchRes.data?.sellers) {
        setSearchResults(searchRes.data.sellers);
      } else {
        // Fall back to mock search
        const allSellers = [...MOCK_SELLERS];
        const filtered = allSellers.filter(seller =>
          seller.name.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Fall back to mock search on error
      const allSellers = [...MOCK_SELLERS];
      const filtered = allSellers.filter(seller =>
        seller.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } finally {
      setLoading(false);
    }
  }, [query, searchTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      } else {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchTab]);

  const handleSellerPress = useCallback((seller) => {
    navigation.navigate(ROUTES.SELLER_PROFILE, { seller });
  }, [navigation]);

  const handlePinToggle = useCallback(async (sellerId) => {
    const seller = [...featuredSellers, ...popularSellers, ...nearbySellers]
      .find(s => s._id === sellerId);
    
    if (!seller) return;

    const isPinned = await pinnedStoresUtils.isStorePinned(sellerId);
    
    if (isPinned) {
      await pinnedStoresUtils.unpinStore(sellerId);
      setPinnedStores(prev => prev.filter(s => s._id !== sellerId));
    } else {
      await pinnedStoresUtils.pinStore(seller);
      setPinnedStores(prev => [...prev, seller]);
    }
  }, [featuredSellers, popularSellers, nearbySellers]);

  const handleProductPress = useCallback((product, index) => {
    // Navigate to product detail
    if (product) {
      openItemDetail(navigation, { listingId: product.id, item: product, sharedId: product.id });
    }
  }, [navigation]);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'sellers', label: 'Sellers' },
    { key: 'stores', label: 'Stores' },
    { key: 'products', label: 'Products' },
  ];

  if (loading && !isSearching) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemeStatusBar variant="header" />
        <View style={[styles.header, { paddingTop: 8 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.exploreTitle}>Discover</Text>
              <Text style={styles.exploreSubtitle}>Find trusted sellers & stores near you</Text>
            </View>
          </View>
        </View>
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search sellers, stores or products..."
          />
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
          {/* Loading skeleton states */}
          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <Skeleton width={160} height={18} borderRadius={4} />
              <Skeleton width={50} height={13} borderRadius={4} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
              scrollEventThrottle={16}
            >
              {[1, 2, 3].map(i => (
                <SellerProfileCardSkeleton key={i} width={CARD_WIDTH} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.popularSection}>
            <View style={styles.sectionHeader}>
              <Skeleton width={150} height={18} borderRadius={4} />
              <Skeleton width={50} height={13} borderRadius={4} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularScroll}
              scrollEventThrottle={16}
            >
              {[1, 2, 3].map(i => (
                <SellerProfileCardSkeleton key={i} width={CARD_WIDTH} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.nearbySection}>
            <View style={styles.sectionHeader}>
              <Skeleton width={160} height={18} borderRadius={4} />
              <Skeleton width={50} height={13} borderRadius={4} />
            </View>
            <View style={styles.nearbyList}>
              {[1, 2, 3, 4, 5].map(i => (
                <View key={i} style={styles.nearbyItem}>
                  <Skeleton width={44} height={44} borderRadius={22} marginRight={12} />
                  <View style={{ flex: 1 }}>
                    <Skeleton width={120} height={15} borderRadius={4} marginBottom={4} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Skeleton width={40} height={12} borderRadius={4} />
                      <Skeleton width={35} height={12} borderRadius={4} />
                    </View>
                  </View>
                  <Skeleton width={20} height={20} borderRadius={10} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemeStatusBar variant="header" />
      <View style={[styles.header, { paddingTop: 8 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.exploreTitle}>Discover</Text>
            <Text style={styles.exploreSubtitle}>Find trusted sellers & stores near you</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search sellers, stores or products..."
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        {isSearching ? (
          <View style={styles.searchContent}>
            <View style={styles.searchTabs}>
              {tabs.map(tab => (
                <Pressable
                  key={tab.key}
                  style={[styles.searchTab, searchTab === tab.key && styles.searchTabActive]}
                  onPress={() => setSearchTab(tab.key)}
                >
                  <Text style={[styles.searchTabText, searchTab === tab.key && styles.searchTabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : searchResults.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title="No results found"
                body="Try adjusting your search terms to find sellers or stores."
              />
            ) : (
              <View style={styles.searchResults}>
                {searchResults.map(seller => (
                  <SellerProfileCard
                    key={seller._id}
                    seller={seller}
                    onPress={() => handleSellerPress(seller)}
                    onPinToggle={() => handlePinToggle(seller._id)}
                    isPinned={pinnedStores.some(s => s._id === seller._id)}
                    onProductPress={handleProductPress}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Pinned Stores Section - Only show when there are pinned stores */}
            {pinnedStores.length > 0 && (
              <View style={styles.pinnedSection}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="bookmark" size={20} color={colors.primary} style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>My Pinned Stores</Text>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pinnedScroll}
                  scrollEventThrottle={16}
                >
                  {pinnedStores.map(seller => (
                    <SellerProfileCard
                      key={seller._id}
                      seller={seller}
                      compact
                      onPress={() => handleSellerPress(seller)}
                      onPinToggle={() => handlePinToggle(seller._id)}
                      isPinned={true}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Featured Sellers Section */}
            <View style={styles.featuredSection}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={20} color={colors.warning} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Featured Near You</Text>
                </View>
                <Pressable onPress={() => {}}>
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              </View>
              {featuredSellers.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredScroll}
                  scrollEventThrottle={16}
                >
                  {featuredSellers.map(seller => (
                    <SellerProfileCard
                      key={seller._id}
                      seller={seller}
                      onPress={() => handleSellerPress(seller)}
                      onPinToggle={() => handlePinToggle(seller._id)}
                      isPinned={pinnedStores.some(s => s._id === seller._id)}
                      onProductPress={handleProductPress}
                    />
                  ))}
                </ScrollView>
              ) : (
                <EmptyState
                  icon="star-outline"
                  title="No featured sellers available"
                  body="Make sure your backend server is running on port 5001."
                  compact
                />
              )}
            </View>

            {/* Popular Sellers Section */}
            <View style={styles.popularSection}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="flame" size={20} color={colors.error} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Popular Sellers</Text>
                </View>
                <Pressable onPress={() => {}}>
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              </View>
              {popularSellers.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.popularScroll}
                  scrollEventThrottle={16}
                >
                  {popularSellers.map(seller => (
                    <SellerProfileCard
                      key={seller._id}
                      seller={seller}
                      onPress={() => handleSellerPress(seller)}
                      onPinToggle={() => handlePinToggle(seller._id)}
                      isPinned={pinnedStores.some(s => s._id === seller._id)}
                      onProductPress={handleProductPress}
                    />
                  ))}
                </ScrollView>
              ) : (
                <EmptyState
                  icon="flame-outline"
                  title="No popular sellers available"
                  body="Make sure your backend server is running on port 5001."
                  compact
                />
              )}
            </View>

            {/* Nearby Sellers Section */}
            <View style={styles.nearbySection}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location" size={20} color={colors.primary} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Sellers Near You</Text>
                </View>
                <Pressable onPress={() => {}}>
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              </View>
              {nearbySellers.length > 0 ? (
                <View style={styles.nearbyList}>
                  {nearbySellers.slice(0, 5).map(seller => (
                    <Pressable
                      key={seller._id}
                      style={styles.nearbyItem}
                      onPress={() => handleSellerPress(seller)}
                    >
                      <View style={styles.nearbyAvatar}>
                        {seller.avatarUrl ? (
                          <Image source={{ uri: seller.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 22 }} />
                        ) : (
                          <Ionicons name="storefront-outline" size={24} color={colors.textMuted} />
                        )}
                      </View>
                      <View style={styles.nearbyInfo}>
                        <Text style={styles.nearbyName}>{seller.name}</Text>
                        <View style={styles.nearbyMeta}>
                          <View style={styles.nearbyRating}>
                            <Ionicons name="star" size={12} color={colors.warning} />
                            <Text style={styles.nearbyRatingText}>{seller.rating}</Text>
                          </View>
                          <View style={styles.nearbyDistance}>
                            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.nearbyDistanceText}>
                              {seller.distance < 1 ? `${Math.round(seller.distance * 1000)} m` : `${seller.distance.toFixed(1)} km`}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="location-outline"
                  title="No nearby sellers available"
                  body="Make sure your backend server is running on port 5001."
                  compact
                />
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}