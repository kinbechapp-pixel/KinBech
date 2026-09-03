import { Text, View, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { openItemDetail, ROUTES } from '../navigation/helpers';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

// Confetti color keys for theme resolution
const CONFETTI_COLORS = [
  'warningYellow',
  'gradientStart',
  'accentPink',
  'secondary',
];

// Base confetti configuration with color keys
const CONFETTI_CONFIG = [
  { type: 'dot', top: 20, left: 130, size: 8, colorKey: 0 },
  { type: 'dot', top: 62, left: 70, size: 6, colorKey: 1 },
  { type: 'rect', top: 40, left: 220, size: 14, colorKey: 2, rotate: '35deg' },
  { type: 'dot', top: 68, left: 320, size: 6, colorKey: 2 },
  { type: 'star', top: 108, left: 320, size: 18, colorKey: 0 },
  { type: 'rect', top: 120, left: 62, size: 14, colorKey: 1, rotate: '-20deg' },
  { type: 'dot', top: 130, left: 300, size: 6, colorKey: 1 },
  { type: 'star', top: 20, left: 10, size: 22, colorKey: 3 },
  { type: 'dot', top: 200, left: 8, size: 8, colorKey: 3 },
  { type: 'rect', top: 220, left: 55, size: 14, colorKey: 1, rotate: '-30deg' },
  { type: 'dot', top: 240, left: 250, size: 6, colorKey: 2 },
  { type: 'star', top: 250, left: 335, size: 18, colorKey: 0 },
  { type: 'dot', top: 265, left: 55, size: 6, colorKey: 0 },
  { type: 'rect', top: 275, left: 215, size: 12, colorKey: 1, rotate: '20deg' },
  { type: 'dot', top: 300, left: 130, size: 4, colorKey: 2 },
];

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

function ConfettiPiece({ piece, colors }) {
  const color = typeof piece.colorKey === 'number' 
    ? resolveColor(CONFETTI_COLORS[piece.colorKey], colors)
    : resolveColor(piece.colorKey, colors);
    
  const base = {
    position: 'absolute',
    top: piece.top,
    left: piece.left,
  };
  if (piece.type === 'dot') {
    return (
      <View
        style={[
          base,
          {
            width: piece.size,
            height: piece.size,
            borderRadius: piece.size / 2,
            backgroundColor: color,
          },
        ]}
      />
    );
  }
  if (piece.type === 'rect') {
    return (
      <View
        style={[
          base,
          {
            width: piece.size,
            height: piece.size * 0.6,
            borderRadius: 3,
            backgroundColor: color,
            transform: [{ rotate: piece.rotate ?? '0deg' }],
          },
        ]}
      />
    );
  }
  // star
  return (
    <Ionicons
      name="sparkles"
      size={piece.size}
      color={color}
      style={base}
    />
  );
}

export default function ListingSuccessScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { listing } = route.params ?? {};

  // Guard against undefined colors
  if (!colors) {
    return null;
  }

  // Resolve confetti colors
  const resolvedConfetti = (CONFETTI_CONFIG || []).map(piece => ({
    ...piece,
    colorKey: typeof piece.colorKey === 'number'
      ? resolveColor(`colors.${CONFETTI_COLORS[piece.colorKey]}`, colors)
      : resolveColor(`colors.${piece.colorKey}`, colors)
  }));

  const handleShare = () => {
    // TODO: wire up native Share sheet
  };

  const handleViewListing = () => {
    navigation.replace(ROUTES.ITEM_DETAIL, { listingId: listing?.id });

  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.confettiWrap}>
        {(resolvedConfetti || []).map((piece, i) => (
          <ConfettiPiece key={i} piece={piece} />
        ))}
        <View style={styles.glow} />
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.checkCircle}
        >
          <Ionicons name="checkmark" size={64} color={colors.white} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Listing Posted{'\n'}Successfully!</Text>
      <Text style={styles.subtitle}>Your item is now live</Text>

      <View style={styles.listingCard}>
        {listing?.imageUrl ? (
          <Image source={{ uri: listing.imageUrl }} style={styles.listingImage} />
        ) : (
          <View style={[styles.listingImage, styles.listingImageFallback]}>
            <Ionicons name="image-outline" size={28} color={colors.primary} />
          </View>
        )}
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {listing?.title}
          </Text>
          <Text style={styles.listingPrice}>
            Rs {Number(String(listing?.price ?? 0).replace(/[^\d]/g, '') || 0).toLocaleString('en-NP')}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color={colors.textMuted} />
            <Text style={styles.locationText}>{listing?.location}</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonsRow}>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color={colors.gradientStart} />
          <Text style={styles.shareLabel}>Share Listing</Text>
        </Pressable>

        <Pressable style={styles.viewButtonWrap} onPress={handleViewListing}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.viewButton}
          >
            <Ionicons name="eye-outline" size={18} color={colors.white} />
            <Text style={styles.viewLabel}>View Listing</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  confettiWrap: {
    width: 360,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.gradientStart,
    opacity: 0.08,
  },
  checkCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gradientStart,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 38,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 24,
  },
  listingCard: {
    flexDirection: 'row',
    width: '100%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  listingImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  listingImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  listingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.price,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 32,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.link,
    backgroundColor: 'transparent',
  },
  shareLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.link,
  },
  viewButtonWrap: {
    flex: 1,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  viewLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});