import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Image, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSharedTransition } from '../context/SharedTransitionContext';
import { useTheme, useThemedStyles } from '../theme';

export const CARD_ROW_PADDING = 16;
export const CARD_GAP = 10;
export const PEEK_VISIBLE = 2.5;

/** Width so `visibleCount` cards (e.g. 3.5) fit in one screen row. */
export function peekCardWidth(screenWidth, visibleCount = PEEK_VISIBLE) {
  const width = screenWidth ?? Dimensions.get('window').width;
  const gapsInView = Math.floor(visibleCount);
  return (width - CARD_ROW_PADDING - CARD_GAP * gapsInView) / visibleCount;
}

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

const createStyles = (colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  image: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  metaBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'column',
    gap: 4,
    zIndex: 2,
  },
  viewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  viewsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 110, 253, 0.9)',
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  body: {
    padding: 8,
    gap: 3,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.price,
  },
  priceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  priceMetaIcon: {
    fontSize: 10,
  },
  priceMetaText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  smallMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  smallMetaIcon: {
    fontSize: 10,
  },
  smallMetaText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  smallMetaDistance: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default function ProductCard({
  title,
  price,
  location,
  icon = 'cube-outline',
  imageColor,
  photo,
  compact = false,
  width,
  saved: savedProp,
  onToggleSave,
  onPress,
  views,
  distanceLabel,
  sharedId,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width: screenWidth } = useWindowDimensions();
  const { tryBeginNavigation } = useSharedTransition();
  const [savedLocal, setSavedLocal] = useState(false);
  const saved = savedProp ?? savedLocal;
  const bgColor = resolveColor(imageColor, colors) ?? colors.iconBackground;
  const cardWidth = width ?? (compact ? peekCardWidth(screenWidth) : undefined);
  const imageHeight = compact ? Math.round((cardWidth || peekCardWidth(screenWidth)) * 0.78) : 110;
  const iconSize = compact ? 28 : 42;

  const photoTag = sharedId ? `item.${sharedId}.photo` : undefined;
  const titleTag = sharedId ? `item.${sharedId}.title` : undefined;
  const priceTag = sharedId ? `item.${sharedId}.price` : undefined;

  const handlePress = () => {
    if (!onPress) return;
    tryBeginNavigation(sharedId, onPress);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.card, cardWidth ? { width: cardWidth } : null]}
    >
      <View style={[styles.image, { backgroundColor: bgColor, height: imageHeight }]}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={styles.imageFill}
            resizeMode="cover"
            sharedTransitionTag={photoTag}
          />
        ) : (
          <Ionicons
            name={icon}
            size={iconSize}
            color={colors.link}
            sharedTransitionTag={photoTag}
          />
        )}

        <Pressable
          onPress={() => {
            if (onToggleSave) {
              onToggleSave();
              return;
            }
            setSavedLocal((value) => !value);
          }}
          style={styles.heart}
          hitSlop={8}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={16}
            color={saved ? colors.favorite : colors.textMuted}
          />
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.title} sharedTransitionTag={titleTag}>
          {title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price} sharedTransitionTag={priceTag}>{price}</Text>
          <View style={styles.priceMeta}>
            {distanceLabel && (
              <View style={styles.priceMetaItem}>
                <Ionicons name="navigate" size={10} color={colors.textMuted} style={styles.priceMetaIcon} />
                <Text style={styles.priceMetaText}>{distanceLabel}</Text>
              </View>
            )}
            {views != null && Number(views) >= 0 && (
              <View style={styles.priceMetaItem}>
                <Ionicons name="eye" size={10} color={colors.textMuted} style={styles.priceMetaIcon} />
                <Text style={styles.priceMetaText}>
                  {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
                </Text>
              </View>
            )}
          </View>
        </View>
        {location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.location} numberOfLines={1}>{location}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
