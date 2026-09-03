import { useState, memo, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, Text, View, Animated, Dimensions } from 'react-native';
import { useTheme, useThemedStyles } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(200, SCREEN_WIDTH / 2.0); // Better width for content

const createStyles = (colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    width: CARD_WIDTH,
  },
  coverImage: {
    width: '100%',
    height: 80,
    backgroundColor: colors.iconBackground,
  },
  coverImageContent: {
    width: '100%',
    height: '100%',
  },
  avatarContainer: {
    position: 'absolute',
    top: 55,
    left: 12,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.surface,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconBackground,
  },
  content: {
    paddingTop: 35,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.pastelGreen,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pinButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statIcon: {
    fontSize: 12,
  },
  statText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 10,
    color: colors.textMuted,
    flex: 1,
  },
  viewStoreButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  viewStoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  gallerySection: {
    marginTop: 4,
  },
  galleryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
  },
  gallery: {
    flexDirection: 'row',
    gap: 6,
  },
  galleryItem: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: colors.iconBackground,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  compactCard: {
    width: SCREEN_WIDTH / 3.5,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  compactName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  compactStats: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  compactStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  compactStatText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  compactPinButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const SellerProfileCard = memo(function SellerProfileCard({
  seller,
  avatar,
  coverImage,
  sellerName,
  storeName,
  verified = false,
  rating,
  reviewCount,
  distance,
  listingCount,
  location,
  isPinned = false,
  isFollowing = false,
  productGallery = [],
  compact = false,
  onPress,
  onPinToggle,
  onFollowToggle,
  onProductPress,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [pinnedLocal, setPinnedLocal] = useState(isPinned);
  const pinned = pinnedLocal;
  
  // Micro-animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pinScaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    if (onPress) onPress();
  }, [onPress]);

  const handlePinToggle = useCallback(() => {
    Animated.sequence([
      Animated.timing(pinScaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pinScaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setPinnedLocal((prev) => !prev);
    if (onPinToggle) onPinToggle(!pinned);
  }, [onPinToggle, pinned, pinScaleAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const displayName = storeName || sellerName || seller?.name || 'Store';
  const displayRating = rating || seller?.rating || '4.8';
  const displayReviews = reviewCount || seller?.reviewsCount || 0;
  const displayListings = listingCount || seller?.listingCount || 0;
  const displayDistance = distance || seller?.distance;
  const displayLocation = location || seller?.location || 'Unknown location';
  const displayAvatar = avatar || seller?.avatarUrl;
  const displayCover = coverImage || seller?.coverImage;

  const distanceLabel = displayDistance 
    ? (displayDistance < 1 ? `${Math.round(displayDistance * 1000)} m` : `${displayDistance.toFixed(1)} km`)
    : null;

  const galleryItems = productGallery?.slice(0, 4) || [];
  const remainingCount = Math.max(0, (productGallery?.length || 0) - 4);

  if (compact) {
    return (
      <Animated.View style={[styles.compactCard, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ flex: 1 }}
        >
          <Animated.View style={{ transform: [{ scale: pinScaleAnim }] }}>
            <Pressable
              onPress={handlePinToggle}
              hitSlop={8}
              style={styles.compactPinButton}
            >
              <Ionicons
                name={pinned ? 'bookmark' : 'bookmark-outline'}
                size={14}
                color={pinned ? colors.primary : colors.textMuted}
              />
            </Pressable>
          </Animated.View>

          <View style={styles.compactAvatar}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="storefront-outline" size={24} color={colors.textMuted} />
            )}
          </View>

          <Text style={styles.compactName} numberOfLines={1}>{displayName}</Text>

          <View style={styles.compactStats}>
            <View style={styles.compactStat}>
              <Ionicons name="star" size={10} color={colors.warning} />
              <Text style={styles.compactStatText}>{displayRating}</Text>
            </View>
            {distanceLabel && (
              <View style={styles.compactStat}>
                <Ionicons name="location-outline" size={10} color={colors.textMuted} />
                <Text style={styles.compactStatText}>{distanceLabel}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {displayCover ? (
          <Image source={{ uri: displayCover }} style={styles.coverImageContent} resizeMode="cover" />
        ) : (
          <View style={styles.coverImage} />
        )}

        <View style={styles.avatarContainer}>
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="storefront-outline" size={32} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName} numberOfLines={1}>{displayName}</Text>
              {verified && (
                <View style={styles.verifiedRow}>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={10} color={colors.primary} />
                    <Text style={styles.verifiedText}>Verified Seller</Text>
                  </View>
                </View>
              )}
            </View>
            <View style={styles.actionButtons}>
              <Animated.View style={{ transform: [{ scale: pinScaleAnim }] }}>
                <Pressable
                  onPress={handlePinToggle}
                  hitSlop={8}
                  style={styles.pinButton}
                >
                  <Ionicons
                    name={pinned ? 'bookmark' : 'bookmark-outline'}
                    size={16}
                    color={pinned ? colors.primary : colors.textMuted}
                  />
                </Pressable>
              </Animated.View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={12} color={colors.warning} style={styles.statIcon} />
              <Text style={styles.statValue}>{displayRating}</Text>
              <Text style={styles.statText}>({displayReviews})</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={12} color={colors.textMuted} style={styles.statIcon} />
              <Text style={styles.statValue}>{displayListings}</Text>
            </View>
            {distanceLabel && (
              <View style={styles.statItem}>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} style={styles.statIcon} />
                <Text style={styles.statText}>{distanceLabel}</Text>
              </View>
            )}
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={10} color={colors.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>{displayLocation}</Text>
          </View>

          <Pressable style={styles.viewStoreButton} onPress={handlePress}>
            <Text style={styles.viewStoreText}>View Store</Text>
          </Pressable>

          {galleryItems.length > 0 && (
            <View style={styles.gallerySection}>
              <Text style={styles.galleryLabel}>Product Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
                {galleryItems.map((item, index) => (
                  <Pressable
                    key={index}
                    style={styles.galleryItem}
                    onPress={() => onProductPress?.(item, index)}
                  >
                    {item ? (
                      <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.galleryItem} />
                    )}
                    {index === 3 && remainingCount > 0 && (
                      <View style={styles.moreOverlay}>
                        <Text style={styles.moreText}>+{remainingCount}</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default SellerProfileCard;