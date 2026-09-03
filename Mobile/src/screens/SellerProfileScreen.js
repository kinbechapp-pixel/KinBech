import { useCallback, useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedTransition } from '../context/SharedTransitionContext';
import { openItemDetail } from '../navigation/helpers';
import { api } from '../services/api';
import { formatPrice } from '../utils/listing';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEMO_LISTINGS = [
  {
    _id: 'demo-1',
    id: 'demo-1',
    title: 'Wireless Earbuds',
    price: 2499,
    location: 'Kathmandu',
    status: 'active',
    rating: 4.7,
    reviews: 32,
    photos: [],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-2',
    id: 'demo-2',
    title: 'Smart Watch',
    price: 3999,
    location: 'Pokhara',
    status: 'active',
    rating: 4.5,
    reviews: 28,
    photos: [],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-3',
    id: 'demo-3',
    title: 'Sport Shoes',
    price: 2200,
    location: 'Kathmandu',
    status: 'active',
    rating: 4.6,
    reviews: 45,
    photos: [],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-4',
    id: 'demo-4',
    title: 'Backpack',
    price: 1499,
    location: 'Lalitpur',
    status: 'active',
    rating: 4.8,
    reviews: 37,
    photos: [],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-5',
    id: 'demo-5',
    title: 'Mobile Phone (iPhone)',
    price: 65000,
    location: 'Kathmandu',
    status: 'active',
    rating: 4.9,
    reviews: 120,
    photos: [],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-6',
    id: 'demo-6',
    title: 'Hoodie',
    price: 1200,
    location: 'Bhaktapur',
    status: 'active',
    rating: 4.4,
    reviews: 18,
    photos: [],
    createdAt: new Date().toISOString(),
  },
];

const createStyles = (colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.gradientStart,
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfoWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
  },
  tagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statCol: {
    alignItems: 'flex-start',
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statIcon: {
    opacity: 0.9,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  statReviews: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gradientStart,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 14,
    position: 'relative',
    marginRight: 28,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.gradientStart,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.gradientStart,
    borderRadius: 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 10,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  statusPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusPillActive: {
    backgroundColor: colors.gradientStart,
    borderColor: colors.gradientStart,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusPillTextActive: {
    color: colors.onPrimary,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  listingCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  listingImageWrap: {
    width: '100%',
    height: (SCREEN_WIDTH - 44) / 2 * 0.62,
    backgroundColor: colors.iconBackground,
    position: 'relative',
  },
  listingImageContent: {
    width: '100%',
    height: '100%',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.gradientStart,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    padding: 10,
  },
  listingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 17,
  },
  listingPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.gradientStart,
  },
  priceTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.pastelGreen,
  },
  priceTrendBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.gradientStart,
  },
  listingRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listingRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  listingReviews: {
    fontSize: 11,
    color: colors.textMuted,
  },
  listingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  listingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  listingLocationText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  moreBtnCard: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});

export default function SellerProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { tryBeginNavigation } = useSharedTransition();
  const seller = route?.params?.seller;
  const sellerId = seller?._id || seller?.id;
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('active');
  const [activeTab, setActiveTab] = useState('listings');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const statusForApi = filterStatus === 'all' ? undefined : filterStatus;
        let data = null;
        let error = null;
        if (sellerId) {
          const res = await api.getListings({ seller: sellerId, status: statusForApi });
          data = res.data;
          error = res.error;
        } else {
          await new Promise((r) => setTimeout(r, 300));
        }
        if (!active) return;
        let resultListings = [];
        if (!error && data?.listings?.length) {
          resultListings = data.listings;
        } else if (filterStatus !== 'sold') {
          resultListings = DEMO_LISTINGS;
        }
        resultListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setListings(resultListings);
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [sellerId, filterStatus])
  );

  const handleListingPress = (listing) => {
    const id = listing._id || listing.id;
    openItemDetail(navigation, { listingId: id, item: listing, sharedId: id });
  };

  if (!seller) {
    return (
      <View style={styles.root}>
        <ThemeStatusBar variant="header" />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.onPrimary} />
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color={colors.textMuted} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Seller Not Found</Text>
          <Text style={styles.emptySubtitle}>Unable to load seller information</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ThemeStatusBar variant="header" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={colors.onPrimary} />
            </Pressable>
            <Pressable style={styles.moreBtn}>
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.onPrimary} />
            </Pressable>
          </View>

          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {seller.avatarUrl ? (
                  <Image source={{ uri: seller.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="person" size={44} color={colors.text} />
                  </View>
                )}
              </View>
              <View style={styles.onlineIndicator} />
            </View>

            <View style={styles.profileInfoWrap}>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{seller.name || 'Seller'}</Text>
                  <Ionicons name="checkmark-circle" size={20} color={colors.onPrimary} style={styles.verifiedBadge} />
                </View>
                <Text style={styles.tagline}>Quality products at best price 🛍️</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <View style={styles.statTop}>
                      <Ionicons name="star" size={15} color="#FFD700" style={styles.statIcon} />
                      <Text style={styles.ratingText}>{seller.rating || '4.8'}</Text>
                      <Ionicons name="star" size={12} color="#FFD700" style={styles.statIcon} />
                    </View>
                    <Text style={styles.statReviews}>({seller.reviewsCount || 124})</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>

                  <View style={styles.statCol}>
                    <View style={styles.statTop}>
                      <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.85)" style={styles.statIcon} />
                      <Text style={styles.statValue}>{seller.followers || '2.3K'}</Text>
                    </View>
                    <View style={{ height: 14 }} />
                    <Text style={styles.statLabel}>Followers</Text>
                  </View>

                  <View style={styles.statCol}>
                    <View style={styles.statTop}>
                      <MaterialIcons name="label-outline" size={16} color="rgba(255,255,255,0.85)" style={styles.statIcon} />
                      <Text style={styles.statValue}>{seller.following || '56'}</Text>
                    </View>
                    <View style={{ height: 14 }} />
                    <Text style={styles.statLabel}>Following</Text>
                  </View>
                </View>
              </View>

              <Pressable style={styles.followBtn}>
                <Ionicons name="person-add" size={16} color={colors.gradientStart} />
                <Text style={styles.followBtnText}>Follow</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.tabsRow}>
          <Pressable style={styles.tabItem} onPress={() => setActiveTab('listings')}>
            <Ionicons
              name="grid"
              size={18}
              color={activeTab === 'listings' ? colors.gradientStart : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'listings' && styles.tabTextActive]}>Listings</Text>
            {activeTab === 'listings' && <View style={styles.tabIndicator} />}
          </Pressable>
          <Pressable style={styles.tabItem} onPress={() => setActiveTab('about')}>
            <Ionicons
              name="person-outline"
              size={18}
              color={activeTab === 'about' ? colors.gradientStart : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>About</Text>
            {activeTab === 'about' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>

        {activeTab === 'listings' && (
          <>
            <View style={styles.filterRow}>
              <Pressable style={styles.sortBtn}>
                <Ionicons name="swap-vertical" size={16} color={colors.textSecondary} />
                <Text style={styles.sortBtnText}>Sort</Text>
                <Text style={[styles.sortBtnText, { fontWeight: '700', color: colors.text }]}>Newest</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
              </Pressable>

              <View style={styles.statusPillsRow}>
                <Pressable
                  style={[styles.statusPill, filterStatus === 'active' && styles.statusPillActive]}
                  onPress={() => setFilterStatus('active')}
                >
                  <Text style={[styles.statusPillText, filterStatus === 'active' && styles.statusPillTextActive]}>Active</Text>
                </Pressable>
                <Pressable
                  style={[styles.statusPill, filterStatus === 'sold' && styles.statusPillActive]}
                  onPress={() => setFilterStatus('sold')}
                >
                  <Text style={[styles.statusPillText, filterStatus === 'sold' && styles.statusPillTextActive]}>Sold</Text>
                </Pressable>
                <Pressable
                  style={[styles.statusPill, filterStatus === 'all' && styles.statusPillActive]}
                  onPress={() => setFilterStatus('all')}
                >
                  <Text style={[styles.statusPillText, filterStatus === 'all' && styles.statusPillTextActive]}>All</Text>
                </Pressable>
              </View>

              <Pressable style={styles.filterBtn}>
                <Ionicons name="filter" size={16} color={colors.textSecondary} />
                <Text style={styles.filterBtnText}>Filter</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.gradientStart} size="large" />
              </View>
            ) : listings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={colors.textMuted} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No Listings</Text>
                <Text style={styles.emptySubtitle}>This seller has no items for sale</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {listings.map((listing) => {
                  const id = listing._id || listing.id;
                  return (
                  <Pressable
                    key={id}
                    style={styles.listingCard}
                    onPress={() => handleListingPress(listing)}
                  >
                    <View style={styles.listingImageWrap}>
                      {listing.photos?.[0] ? (
                        <Image source={{ uri: listing.photos[0] }} style={styles.listingImageContent} resizeMode="cover" sharedTransitionTag={`item.${id}.photo`} />
                      ) : (
                        <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }} sharedTransitionTag={`item.${id}.photo`}>
                          <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                        </View>
                      )}
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{listing.status === 'sold' ? 'Sold' : 'Active'}</Text>
                      </View>
                      <Pressable style={styles.favoriteBtn} hitSlop={6}>
                        <Ionicons name="heart-outline" size={17} color={colors.text} />
                      </Pressable>
                    </View>

                    <View style={styles.listingInfo}>
                      <Text style={styles.listingTitle} numberOfLines={2} sharedTransitionTag={`item.${id}.title`}>
                        {listing.title}
                      </Text>

                      <View style={styles.listingPriceRow}>
                        <Text style={styles.listingPrice} sharedTransitionTag={`item.${id}.price`}>{formatPrice(listing.price)}</Text>
                        <View style={styles.priceTrendBadge}>
                          <Ionicons name="trending-up" size={11} color={colors.gradientStart} />
                          <Text style={styles.priceTrendBadgeText}>Low to High</Text>
                        </View>
                      </View>

                      <View style={styles.listingRatingRow}>
                        <View style={styles.listingRating}>
                          <Ionicons name="star" size={12} color={colors.rating} />
                          <Text style={styles.listingRatingText}>{listing.rating || '4.5'}</Text>
                          <Text style={styles.listingReviews}>({listing.reviews || 32})</Text>
                        </View>
                      </View>

                      <View style={styles.listingLocationRow}>
                        <View style={styles.listingLocation}>
                          <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                          <Text style={styles.listingLocationText} numberOfLines={1}>
                            {listing.location || 'Kathmandu'}
                          </Text>
                        </View>
                        <Pressable style={styles.moreBtnCard} hitSlop={8}>
                          <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {activeTab === 'about' && (
          <View style={styles.emptyState}>
            <Ionicons name="person-circle-outline" size={48} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>About Seller</Text>
            <Text style={styles.emptySubtitle}>Seller bio and information</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
