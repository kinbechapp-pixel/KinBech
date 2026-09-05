import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedTransition } from '../context/SharedTransitionContext';
import { openItemDetail, ROUTES } from '../navigation/helpers';
import { api } from '../services/api';
import { attachDistanceToCard, toCardItem } from '../utils/listing';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';
import { useAuth } from '../context/AuthContext';
import SellerProfileCard from '../components/SellerProfileCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import ProductCardCarousel from '../components/ProductCardCarousel';
import pinnedStoresUtils from '../utils/pinnedStores';
import { Skeleton, SellerProfileCardSkeleton } from '../components/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(200, SCREEN_WIDTH / 2.0);
const SIDEBAR_WIDTH = 70;
const GRID_GUTTER = 8;
const GRID_PADDING = 10;

// Product categories
const PRODUCT_CATEGORIES = [
  { label: 'Mobiles', icon: 'phone-portrait-outline', tint: '#5B39C6' },
  { label: 'Laptops', icon: 'laptop-outline', tint: '#16A34A' },
  { label: 'Electronics', icon: 'headset-outline', tint: '#DB2777' },
  { label: 'Furniture', icon: 'file-tray-stacked-outline', tint: '#059669' },
  { label: 'Vehicles', icon: 'car-outline', tint: '#4F46E5' },
  { label: 'Fashion', icon: 'shirt-outline', tint: '#EC4899' },
  { label: 'Sports & Fitness', icon: 'bicycle-outline', tint: '#0D9488' },
];

// Business/Store categories for local market
const BUSINESS_CATEGORIES = [
  { label: 'Grocery & Kirana', icon: 'basket-outline', tint: '#5B39C6' },
  { label: 'Electronics', icon: 'hardware-chip-outline', tint: '#16A34A' },
  { label: 'Clothing & Fashion', icon: 'shirt-outline', tint: '#DB2777' },
  { label: 'Furniture & Home', icon: 'home-outline', tint: '#059669' },
  { label: 'Medical & Pharmacy', icon: 'medkit-outline', tint: '#4F46E5' },
  { label: 'Food & Restaurant', icon: 'restaurant-outline', tint: '#EC4899' },
  { label: 'Books & Stationery', icon: 'book-outline', tint: '#0D9488' },
  { label: 'Sports & Fitness', icon: 'bicycle-outline', tint: '#F59E0B' },
  { label: 'Automotive', icon: 'car-outline', tint: '#8B5CF6' },
  { label: 'Beauty & Personal Care', icon: 'flower-outline', tint: '#EC4899' },
  { label: 'Jewelry & Accessories', icon: 'diamond-outline', tint: '#F59E0B' },
  { label: 'Hardware & Tools', icon: 'construct-outline', tint: '#6B7280' },
  { label: 'Pet Supplies', icon: 'paw-outline', tint: '#10B981' },
  { label: 'Toys & Games', icon: 'game-controller-outline', tint: '#F43F5E' },
  { label: 'Other', icon: 'ellipsis-horizontal-outline', tint: '#6B7280' },
];

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
    gap: 12,
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
  mainTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    zIndex: 1,
    minWidth: 80,
  },
  mainTabActive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    zIndex: 1,
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  mainTabTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 78, // Initial width, will be animated
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 2,
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: 25,
    padding: 4,
    alignItems: 'center',
  },
  filterModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  filterCloseButton: {
    padding: 8,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterOptionText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
  },
  filterCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCheckboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterCheckboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.onPrimary,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
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
  categoriesSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesScroll: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  categoryTextActive: {
    color: colors.onPrimary,
  },
  mainContent: {
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
    sellerType: 'shop',
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
    sellerType: 'shop',
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
    sellerType: 'shop',
  },
  {
    _id: 'seller4',
    name: 'Rajesh Kumar',
    avatarUrl: null,
    coverImage: null,
    rating: 4.5,
    reviewsCount: 34,
    listingCount: 12,
    distance: 0.8,
    location: 'Kathmandu',
    verified: true,
    productGallery: [],
    sellerType: 'individual',
  },
  {
    _id: 'seller5',
    name: 'Sita Sharma',
    avatarUrl: null,
    coverImage: null,
    rating: 4.9,
    reviewsCount: 28,
    listingCount: 8,
    distance: 1.2,
    location: 'Lalitpur',
    verified: false,
    productGallery: [],
    sellerType: 'individual',
  },
];

export default function ExploreScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { tryBeginNavigation } = useSharedTransition();
  const initialCategory = route?.params?.category;

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTab, setSearchTab] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
  const [pinnedStores, setPinnedStores] = useState([]);
  const [featuredSellers, setFeaturedSellers] = useState([]);
  const [popularSellers, setPopularSellers] = useState([]);
  const [nearbySellers, setNearbySellers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [products, setProducts] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    verified: false,
    nearby: false,
    topRated: false,
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const tabWidthAnim = useRef(new Animated.Value(90)).current;

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
      // Load mock data immediately without waiting for location
      console.log('Using mock seller data for demo - API endpoints not yet implemented');
      const sellersWithDistance = MOCK_SELLERS.map(seller => ({
        ...seller,
        distance: seller.distance,
      }));

      const featuredSellersData = sellersWithDistance.slice(0, 3);
      const popularSellersData = sellersWithDistance.sort((a, b) => b.rating - a.rating);
      const nearbySellersData = sellersWithDistance.sort((a, b) => a.distance - b.distance);

      setFeaturedSellers(featuredSellersData);
      setPopularSellers(popularSellersData);
      setNearbySellers(nearbySellersData);
      
      // Load pinned stores from AsyncStorage in parallel
      pinnedStoresUtils.getPinnedStores().then(pinned => {
        setPinnedStores(pinned);
      }).catch(err => {
        console.log('Failed to load pinned stores:', err);
      });

      // Fetch products immediately without location
      api.getListings().then(({ data: productsData, error: productsError }) => {
        if (!productsError && productsData?.listings) {
          const productsWithDistance = productsData.listings.map(toCardItem).filter(Boolean);
          setProducts(productsWithDistance);
        }
      }).catch(err => {
        console.log('Failed to load products:', err);
      });

      // Get location in background and update data
      fetchCurrentLocation().then(coords => {
        if (coords) {
          // Update seller distances with real location
          const updatedSellers = MOCK_SELLERS.map(seller => ({
            ...seller,
            distance: seller.distance + (Math.random() * 2 - 1),
          }));
          setFeaturedSellers(updatedSellers.slice(0, 3));
          setPopularSellers(updatedSellers.sort((a, b) => b.rating - a.rating));
          setNearbySellers(updatedSellers.sort((a, b) => a.distance - b.distance));

          // Update products with distance
          api.getListings({ lat: coords.lat, lng: coords.lng }).then(({ data: productsData, error: productsError }) => {
            if (!productsError && productsData?.listings) {
              const productsWithDistance = productsData.listings.map(toCardItem).filter(Boolean).map((it) => attachDistanceToCard(it, coords, user?.id));
              setProducts(productsWithDistance);
            }
          }).catch(err => {
            console.log('Failed to update products with location:', err);
          });
        }
      }).catch(err => {
        console.log('Location fetch failed:', err);
      });

      // Trigger entrance animations immediately
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
      
      // Set loading to false immediately since we have mock data
      setLoading(false);
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
      setLoading(false);
    }
  }, [fetchCurrentLocation, fadeAnim, slideAnim, user?.id]);

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

  // Animate tab indicator when active tab changes
  useEffect(() => {
    const targetX = activeTab === 'products' ? 0 : 82;
    const targetWidth = activeTab === 'products' ? 78 : 82;
    
    Animated.parallel([
      Animated.spring(tabIndicatorAnim, {
        toValue: targetX,
        useNativeDriver: false,
        tension: 300,
        friction: 20,
      }),
      Animated.spring(tabWidthAnim, {
        toValue: targetWidth,
        useNativeDriver: false,
        tension: 300,
        friction: 20,
      }),
    ]).start();
  }, [activeTab, tabIndicatorAnim, tabWidthAnim]);

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

  const mainTabs = [
    { key: 'products', label: 'Products' },
    { key: 'sellers', label: 'Sellers' },
  ];

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'sellers', label: 'Sellers' },
    { key: 'stores', label: 'Stores' },
    { key: 'products', label: 'Products' },
  ];

  const categories = useMemo(() => {
    // Always add "All" option at the bottom
    const allOption = { 
      label: 'All', 
      icon: activeTab === 'products' ? 'grid-outline' : 'storefront-outline', 
      tint: '#F59E0B',
      count: activeTab === 'products' ? products.length : [...featuredSellers, ...popularSellers, ...nearbySellers].length
    };

    if (activeTab === 'products') {
      const found = {};
      for (const it of products) {
        const name = it.category || it.listing?.category;
        if (name) found[name] = (found[name] || 0) + 1;
      }
      const fromProducts = Object.keys(found).map((label) => {
        const preset = PRODUCT_CATEGORIES.find((c) => c.label === label);
        return {
          label,
          icon: preset?.icon || 'pricetag-outline',
          tint: preset?.tint || '#F59E0B',
          count: found[label],
        };
      });
      fromProducts.sort((a, b) => b.count - a.count);
      const merged = [...fromProducts];
      for (const preset of PRODUCT_CATEGORIES) {
        if (!merged.find((c) => c.label === preset.label)) {
          merged.push({ ...preset, count: 0 });
        }
      }
      merged.push(allOption);
      return merged;
    } else {
      // Store categories for sellers & stores
      const found = {};
      for (const seller of [...featuredSellers, ...popularSellers, ...nearbySellers]) {
        const name = seller.category || 'General';
        if (name) found[name] = (found[name] || 0) + 1;
      }
      const fromSellers = Object.keys(found).map((label) => {
        const preset = BUSINESS_CATEGORIES.find((c) => c.label === label);
        return {
          label,
          icon: preset?.icon || 'storefront-outline',
          tint: preset?.tint || '#F59E0B',
          count: found[label],
        };
      });
      fromSellers.sort((a, b) => b.count - a.count);
      const merged = [...fromSellers];
      for (const preset of BUSINESS_CATEGORIES) {
        if (!merged.find((c) => c.label === preset.label)) {
          merged.push({ ...preset, count: 0 });
        }
      }
      merged.push(allOption);
      return merged;
    }
  }, [products, featuredSellers, popularSellers, nearbySellers, activeTab]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Apply category filter
    if (activeCategory && activeCategory !== 'All') {
      filtered = filtered.filter(
        (it) => (it.category || it.listing?.category) === activeCategory
      );
    }
    
    // Apply selected filters
    if (selectedFilters.topRated) {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    return filtered;
  }, [products, activeCategory, selectedFilters]);

  const filteredSellers = useMemo(() => {
    let sellers = [...featuredSellers, ...popularSellers, ...nearbySellers];
    
    // Apply category filter
    if (activeCategory && activeCategory !== 'All') {
      sellers = sellers.filter(
        (seller) => (seller.category || 'General') === activeCategory
      );
    }
    
    // Apply selected filters
    if (selectedFilters.verified) {
      sellers = sellers.filter(seller => seller.verified);
    }
    
    if (selectedFilters.nearby) {
      sellers = sellers.sort((a, b) => a.distance - b.distance);
    }
    
    if (selectedFilters.topRated) {
      sellers = sellers.sort((a, b) => b.rating - a.rating);
    }
    
    return sellers;
  }, [featuredSellers, popularSellers, nearbySellers, activeCategory, selectedFilters]);

  // Set initial category when categories change or from navigation params
  useEffect(() => {
    if (activeCategory == null && categories.length > 0) {
      if (initialCategory && categories.find((c) => c.label === initialCategory)) {
        setActiveCategory(initialCategory);
      } else {
        setActiveCategory('All');
      }
    }
  }, [categories, activeCategory, initialCategory]);

  // Debug logging
  useEffect(() => {
    console.log('ExploreScreen Debug:', {
      activeCategory,
      activeTab,
      productsLength: products.length,
      filteredProductsLength: filteredProducts.length,
      featuredSellersLength: featuredSellers.length,
      popularSellersLength: popularSellers.length,
      nearbySellersLength: nearbySellers.length,
      filteredSellersLength: filteredSellers.length,
      categoriesLength: categories.length,
      initialCategory
    });
  }, [activeCategory, activeTab, products.length, filteredProducts.length, featuredSellers.length, popularSellers.length, nearbySellers.length, filteredSellers.length, categories.length, initialCategory]);

  if (loading && !isSearching) {
    return (
      <View style={styles.container}>
        <ThemeStatusBar variant="header" />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.exploreTitle}>Explore</Text>
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
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <ThemeStatusBar variant="header" />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.exploreTitle}>Explore</Text>
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

      {/* Horizontal Categories Scroll */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => {
            const isActive = cat.label === activeCategory;
            return (
              <Pressable
                key={cat.label}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(cat.label)}
              >
                <Ionicons
                  name={cat.icon}
                  size={16}
                  color={isActive ? colors.primary : colors.textMuted}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
          {/* Products/Sellers Tabs */}
          <View style={styles.mainTabs}>
            <View style={styles.tabsContainer}>
              <Animated.View 
                style={[
                  styles.tabIndicator,
                  {
                    transform: [
                      {
                        translateX: tabIndicatorAnim,
                      },
                    ],
                    width: tabWidthAnim,
                  },
                ]}
              />
              {mainTabs.map(tab => (
                <Pressable
                  key={tab.key}
                  style={[styles.mainTab, activeTab === tab.key && styles.mainTabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.mainTabText, activeTab === tab.key && styles.mainTabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable 
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
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

              {searchResults.length === 0 ? (
                <EmptyState
                  compact
                  icon="search-outline"
                  title="No results found"
                  body="Try different words to find sellers or stores."
                />
              ) : (
                <View style={styles.searchResults}>
                  {searchResults.map(seller => (
                    <SellerProfileCard
                      key={seller._id}
                      seller={seller}
                      sellerType={seller.sellerType || 'shop'}
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
              {activeTab === 'products' ? (
                <>
                  {/* Products Tab Content */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="cube" size={20} color={colors.primary} style={styles.sectionIcon} />
                        <Text style={styles.sectionTitle}>Explore Products</Text>
                      </View>
                      <Pressable onPress={() => navigation.navigate(ROUTES.SEARCH_RESULTS)}>
                        <Text style={styles.viewAll}>View all</Text>
                      </Pressable>
                    </View>
                    {filteredProducts.length > 0 ? (
                      <ProductCardCarousel
                        items={filteredProducts.map((item) => ({
                          ...item,
                          onToggleSave: async () => {
                            await api.toggleWishlist(item.id);
                          },
                        }))}
                        onPressItem={(item) => navigation.navigate(ROUTES.ITEM_DETAIL, { listingId: item.id })}
                      />
                    ) : (
                      <EmptyState
                        compact
                        icon="cube-outline"
                        title="No products yet"
                        body="Products will appear here when sellers start listing items."
                      />
                    )}
                  </View>
                </>
              ) : (
                <>
                  {/* Sellers & Stores Tab Content */}
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
                      {pinnedStores.filter(seller => !activeCategory || activeCategory === 'All' || (seller.category || 'General') === activeCategory).map(seller => (
                        <SellerProfileCard
                          key={seller._id}
                          seller={seller}
                          sellerType={seller.sellerType || 'shop'}
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
                  {featuredSellers.filter(seller => !activeCategory || activeCategory === 'All' || (seller.category || 'General') === activeCategory).length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.featuredScroll}
                      scrollEventThrottle={16}
                    >
                      {featuredSellers.filter(seller => !activeCategory || activeCategory === 'All' || (seller.category || 'General') === activeCategory).map(seller => (
                        <SellerProfileCard
                          key={seller._id}
                          seller={seller}
                          sellerType={seller.sellerType || 'shop'}
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
                  {popularSellers.filter(seller => !activeCategory || activeCategory === 'All' || (seller.category || 'General') === activeCategory).length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.popularScroll}
                      scrollEventThrottle={16}
                    >
                      {popularSellers.filter(seller => !activeCategory || activeCategory === 'All' || (seller.category || 'General') === activeCategory).map(seller => (
                        <SellerProfileCard
                          key={seller._id}
                          seller={seller}
                          sellerType={seller.sellerType || 'shop'}
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
              {nearbySellers.filter(seller => !activeCategory || activeCategory === 'All' || (seller.category || 'General') === activeCategory).length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.nearbyList}
                  scrollEventThrottle={16}
                >
                  {nearbySellers.filter(seller => !activeCategory || activeCategory === 'All' || (seller.category || 'General') === activeCategory).slice(0, 5).map(seller => (
                    <SellerProfileCard
                      key={seller._id}
                      seller={seller}
                      sellerType={seller.sellerType || 'shop'}
                      onPress={() => handleSellerPress(seller)}
                      onPinToggle={() => handlePinToggle(seller._id)}
                      isPinned={pinnedStores.some(s => s._id === seller._id)}
                      onProductPress={handleProductPress}
                    />
                  ))}
                </ScrollView>
              ) : (
                <EmptyState
                  icon="location-outline"
                  title="No nearby sellers available"
                  body="Make sure your backend server is running on port 5001."
                  compact
                />
              )}
            </View>
          </>
        )}
      </Animated.View>
    )}
  </ScrollView>

  {/* Filter Modal */}
  <Modal
    visible={showFilterModal}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setShowFilterModal(false)}
  >
    <View style={styles.filterModal}>
    <View style={styles.filterModal}>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => setShowFilterModal(false)}
      />
      <View style={styles.filterModalContent}>
        <View style={styles.filterModalHeader}>
          <Text style={styles.filterModalTitle}>Filters</Text>
          <Pressable
            style={styles.filterCloseButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Filter Options</Text>

          <Pressable
            style={styles.filterOption}
            onPress={() => setSelectedFilters(prev => ({ ...prev, verified: !prev.verified }))}
          >
            <View style={[
              styles.filterCheckbox,
              selectedFilters.verified && styles.filterCheckboxChecked
            ]}>
              {selectedFilters.verified && <View style={styles.filterCheckboxInner} />}
            </View>
            <Text style={styles.filterOptionText}>Verified Sellers Only</Text>
          </Pressable>

          <Pressable
            style={styles.filterOption}
            onPress={() => setSelectedFilters(prev => ({ ...prev, nearby: !prev.nearby }))}
          >
            <View style={[
              styles.filterCheckbox,
              selectedFilters.nearby && styles.filterCheckboxChecked
            ]}>
              {selectedFilters.nearby && <View style={styles.filterCheckboxInner} />}
            </View>
            <Text style={styles.filterOptionText}>Nearby First</Text>
          </Pressable>

          <Pressable
            style={styles.filterOption}
            onPress={() => setSelectedFilters(prev => ({ ...prev, topRated: !prev.topRated }))}
          >
            <View style={[
              styles.filterCheckbox,
              selectedFilters.topRated && styles.filterCheckboxChecked
            ]}>
              {selectedFilters.topRated && <View style={styles.filterCheckboxInner} />}
            </View>
            <Text style={styles.filterOptionText}>Top Rated</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.applyButton}
          onPress={() => {
            console.log('Applied filters:', selectedFilters);
            setShowFilterModal(false);
          }}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
    </>
  );
}