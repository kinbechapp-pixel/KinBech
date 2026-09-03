import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { INFO_COPY, ROUTES } from '../navigation/helpers';
import { api } from '../services/api';
import { categoryIcon, toDetailItem } from '../utils/listing';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';
import { useSharedTransition, BEZIER_EASE_OUT } from '../context/SharedTransitionContext';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 380;

const PHOTOS = [
  { bg: 'photoDark1', icon: 'laptop' },
  { bg: 'photoDark2', icon: 'laptop-outline' },
  { bg: 'photoDark3', icon: 'laptop-outline' },
  { bg: 'photoDark4', icon: 'laptop-outline' },
  { bg: 'photoDark5', icon: 'laptop-outline' },
];

export default function ItemDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { reduceMotion, duration: animDuration } = useSharedTransition();
  const [activeIndex, setActiveIndex] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [descOpen, setDescOpen] = useState(true);
  const [listing, setListing] = useState(route?.params?.item || null);
  const listingId = route?.params?.listingId || listing?.id;
  const sharedId = route?.params?.sharedId || listingId;

  const easeOut = Easing.bezier(...BEZIER_EASE_OUT);
  const baseDuration = reduceMotion ? 120 : animDuration;

  const entryProgress = useSharedValue(0);
  useEffect(() => {
    entryProgress.value = withTiming(1, { duration: baseDuration + 100, easing: easeOut });
  }, [entryProgress, baseDuration, easeOut]);

  useEffect(() => {
    if (!listingId) return undefined;
    let active = true;
    (async () => {
      const { data, error } = await api.getListing(listingId);
      if (active) {
        if (error) {
          console.error('Failed to load listing:', error);
        } else if (data?.listing) {
          setListing(data.listing);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  const item = toDetailItem(listing) || {
    title: 'Listing',
    price: '',
    condition: 'Good',
    location: '',
    posted: '',
    seller: 'Seller',
    rating: '',
    description: '',
    mapAddress: '',
    photos: [],
    listing: null,
  };

  const photoUris = (item.photos || []).filter(Boolean);
  const resolvedPhotos = photoUris.length
    ? photoUris.map((uri) => ({ uri, icon: categoryIcon(listing?.category) }))
    : (PHOTOS || []).map((photo) => ({
        ...photo,
        bg: resolveColor(`colors.${photo.bg}`, colors),
      }));

  const onScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={styles.root}>
      <ThemeStatusBar variant="header" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.imageWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {(resolvedPhotos || []).map((photo, index) => (
              <View
                key={index}
                style={[styles.slide, { backgroundColor: photo.bg || colors.photoDark1 }]}
              >
                {photo.uri ? (
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.slide}
                    resizeMode="cover"
                    sharedTransitionTag={index === 0 && sharedId ? `item.${sharedId}.photo` : undefined}
                  />
                ) : (
                  <Ionicons
                    name={photo.icon || 'cube-outline'}
                    size={90}
                    color="rgba(255,255,255,0.85)"
                    sharedTransitionTag={index === 0 && sharedId ? `item.${sharedId}.photo` : undefined}
                  />
                )}
              </View>
            ))}
          </ScrollView>

          <Animated.View
            entering={reduceMotion ? FadeIn.duration(baseDuration) : FadeInDown.duration(baseDuration * 0.6).delay(baseDuration * 0.25).easing(easeOut)}
          >
            <Pressable
              style={[styles.roundBtn, { top: insets.top + 8, left: 16 }]}
              onPress={() => navigation.goBack()}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={reduceMotion ? FadeIn.duration(baseDuration) : FadeInDown.duration(baseDuration * 0.6).delay(baseDuration * 0.3).easing(easeOut)}
          >
            <Pressable
              style={[styles.roundBtn, { top: insets.top + 8, right: 16 }]}
              onPress={async () => {
                if (!listingId) return;
                const { error } = await api.toggleWishlist(listingId);
                if (!error) setFavorited((v) => !v);
              }}
              hitSlop={10}
            >
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={22}
                color={colors.danger}
              />
            </Pressable>
          </Animated.View>

          <Animated.View
            style={styles.dotsRow}
            entering={reduceMotion ? FadeIn.duration(baseDuration) : FadeIn.duration(baseDuration * 0.6).delay(baseDuration * 0.5).easing(easeOut)}
          >
            {(resolvedPhotos || []).map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === activeIndex && styles.dotActive]}
              />
            ))}
          </Animated.View>

          <Animated.View
            style={styles.counterPill}
            entering={reduceMotion ? FadeIn.duration(baseDuration) : FadeIn.duration(baseDuration * 0.6).delay(baseDuration * 0.55).easing(easeOut)}
          >
            <Text style={styles.counterText}>{activeIndex + 1} / {(resolvedPhotos || []).length}</Text>
          </Animated.View>
        </View>

        <View style={styles.content}>
          <Animated.View
            style={styles.titleRow}
            entering={
              reduceMotion
                ? FadeIn.duration(baseDuration)
                : FadeInUp.duration(baseDuration * 0.6)
                    .delay(baseDuration * 0.35)
                    .easing(easeOut)
            }
          >
            <Text style={styles.title} sharedTransitionTag={sharedId ? `item.${sharedId}.title` : undefined}>{item.title}</Text>
            <View style={styles.conditionPill}>
              <Text style={styles.conditionText}>{item.condition}</Text>
            </View>
          </Animated.View>

          <Animated.Text
            style={styles.price}
            sharedTransitionTag={sharedId ? `item.${sharedId}.price` : undefined}
            entering={
              reduceMotion
                ? FadeIn.duration(baseDuration)
                : FadeInUp.duration(baseDuration * 0.55)
                    .delay(baseDuration * 0.42)
                    .easing(easeOut)
            }
          >
            {item.price}
          </Animated.Text>

          <Animated.View
            style={styles.metaRow}
            entering={
              reduceMotion
                ? FadeIn.duration(baseDuration)
                : FadeInUp.duration(baseDuration * 0.55)
                    .delay(baseDuration * 0.5)
                    .easing(easeOut)
            }
          >
            <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.location}</Text>
            <View style={styles.metaDivider} />
            <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.posted}</Text>
          </Animated.View>

          <Animated.View
            entering={
              reduceMotion
                ? FadeIn.duration(baseDuration)
                : FadeInUp.duration(baseDuration * 0.6)
                    .delay(baseDuration * 0.6)
                    .easing(easeOut)
            }
          >
            <Pressable
              style={styles.sellerCard}
              onPress={() => navigation.navigate(ROUTES.SELLER_PROFILE, { seller: item.sellerData })}
            >
              <View style={styles.sellerAvatar}>
                {item.sellerData?.avatarUrl ? (
                  <Image source={{ uri: item.sellerData.avatarUrl }} style={styles.sellerAvatarImage} />
                ) : (
                  <Ionicons name="person" size={26} color={colors.onGradient} />
                )}
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{item.seller}</Text>
                <View style={styles.sellerRatingRow}>
                  <Ionicons name="star" size={14} color={colors.rating} />
                  <Text style={styles.sellerRating}>{item.rating}</Text>
                </View>
              </View>
              <View style={styles.viewProfileRow}>
                <Text style={styles.viewProfile}>View Profile</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.link} />
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View
            style={styles.divider}
            entering={
              reduceMotion
                ? FadeIn.duration(baseDuration)
                : FadeIn.duration(baseDuration * 0.6).delay(baseDuration * 0.7).easing(easeOut)
            }
          />

          <Animated.View
            entering={
              reduceMotion
                ? FadeIn.duration(baseDuration)
                : FadeInUp.duration(baseDuration * 0.6)
                    .delay(baseDuration * 0.75)
                    .easing(easeOut)
            }
          >
            <Pressable style={styles.sectionHeaderRow} onPress={() => setDescOpen((v) => !v)}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="document-text-outline" size={18} color={colors.text} />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Ionicons
                name={descOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.primary}
              />
            </Pressable>
            {descOpen && <Text style={styles.description}>{item.description}</Text>}
          </Animated.View>

          <Animated.View
            entering={
              reduceMotion
                ? FadeIn.duration(baseDuration)
                : FadeInUp.duration(baseDuration * 0.65)
                    .delay(baseDuration * 0.85)
                    .easing(easeOut)
            }
          >
            <View style={styles.mapCard}>
              <View style={styles.mapPreview}>
                <View style={styles.mapGridLine1} />
                <View style={styles.mapGridLine2} />
                <Ionicons name="location" size={30} color={colors.primary} />
              </View>
              <View style={styles.mapInfo}>
                <Text style={styles.mapLabel}>Location</Text>
                <Text style={styles.mapAddress}>{item.mapAddress}</Text>
                <Pressable onPress={() => navigation.navigate(ROUTES.INFO, INFO_COPY.MapView)}>
                  <Text style={styles.viewOnMap}>View on Map</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={
              reduceMotion
                ? FadeIn.duration(baseDuration)
                : FadeInUp.duration(baseDuration * 0.7)
                    .delay(baseDuration * 0.95)
                    .easing(easeOut)
            }
          >
            <Pressable style={styles.safetyBanner} onPress={() => navigation.navigate(ROUTES.INFO, INFO_COPY.SafetyTips)}>
              <View style={styles.safetyIcon}>
                <Ionicons name="shield-checkmark" size={22} color={colors.onGradient} />
              </View>
              <View style={styles.safetyText}>
                <Text style={styles.safetyTitle}>Stay Safe with Each Other</Text>
                <Text style={styles.safetySubtitle}>
                  Meet in public places and check the item before making payment.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.link} />
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      <Animated.View
        style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}
        entering={
          reduceMotion
            ? FadeIn.duration(baseDuration)
            : SlideInUp.duration(baseDuration * 0.7)
                .delay(baseDuration * 0.55)
                .easing(easeOut)
        }
      >
        <Pressable style={styles.callBtn} onPress={() => {}}>
          <Ionicons name="call" size={18} color={colors.link} />
          <Text style={styles.callText}>Call</Text>
        </Pressable>
        <Pressable
          style={styles.chatBtnWrap}
          onPress={async () => {
            const sellerId = item.sellerId;
            if (!sellerId) {
              navigation.navigate(ROUTES.CHAT, { name: item.seller });
              return;
            }
            if (user?.id && String(user.id) === String(sellerId)) {
              Alert.alert('Your listing', 'You cannot chat with yourself on this item.');
              return;
            }
            const { data, error } = await api.createChat({
              listingId,
              userId: sellerId,
            });
            if (error) {
              Alert.alert('Chat failed', error);
              return;
            }
            navigation.navigate(ROUTES.CHAT, {
              chatId: data.chat.id,
              name: data.chat.otherUser?.name || item.seller,
              listing: listing,
            });
          }}
        >
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chatBtn}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.onGradient} />
            <Text style={styles.chatText}>Chat Now</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageWrap: {
    height: IMAGE_HEIGHT,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.surface,
  },
  counterPill: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 28,
  },
  conditionPill: {
    backgroundColor: colors.conditionColor,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  price: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: '800',
    color: colors.price,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sellerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  sellerRating: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  viewProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfile: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.link,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mapPreview: {
    width: 110,
    height: 100,
    backgroundColor: colors.photoFrame,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mapGridLine1: {
    position: 'absolute',
    width: '150%',
    height: 1,
    backgroundColor: colors.photoLine,
    top: '35%',
    transform: [{ rotate: '12deg' }],
  },
  mapGridLine2: {
    position: 'absolute',
    width: '150%',
    height: 1,
    backgroundColor: colors.photoLine,
    top: '65%',
    transform: [{ rotate: '-8deg' }],
  },
  mapInfo: {
    flex: 1,
    paddingHorizontal: 14,
  },
  mapLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  mapAddress: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },
  viewOnMap: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: colors.link,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: colors.photoPlusBackground,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  safetyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyText: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.link,
  },
  safetySubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.link,
  },
  callText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.link,
  },
  chatBtnWrap: {
    flex: 1.4,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
  },
  chatText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
