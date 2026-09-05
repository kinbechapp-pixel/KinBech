import { Animated, View, Dimensions } from 'react-native';
import { useRef, useEffect } from 'react';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function Skeleton({
  style,
  width,
  height,
  borderRadius,
  margin,
  marginHorizontal,
  marginVertical,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  marginStart,
  marginEnd,
}) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.iconBackground,
          borderRadius: borderRadius ?? 8,
          width,
          height,
          opacity,
          margin,
          marginHorizontal,
          marginVertical,
          marginTop,
          marginBottom,
          marginLeft,
          marginRight,
          marginStart,
          marginEnd,
        },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton({ width, compact = false }) {
  const imageHeight = compact ? Math.round(width * 0.78) : 110;

  return (
    <View style={{ width, borderRadius: 16, overflow: 'hidden' }}>
      <Skeleton width={width} height={imageHeight} borderRadius={16} />
      <View style={{ padding: 8, gap: 3 }}>
        <Skeleton width={width * 0.8} height={12} borderRadius={4} />
        <Skeleton width={width * 0.5} height={14} borderRadius={4} />
        <Skeleton width={width * 0.6} height={10} borderRadius={4} />
      </View>
    </View>
  );
}

export function CategorySkeleton() {
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Skeleton width={48} height={48} borderRadius={12} />
      <Skeleton width={40} height={10} borderRadius={4} />
    </View>
  );
}

export function ChatItemSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12 }}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={{ flex: 1, gap: 4 }}>
        <Skeleton width={120} height={14} borderRadius={4} />
        <Skeleton width={180} height={12} borderRadius={4} />
      </View>
    </View>
  );
}

export function BannerSkeleton() {
  return (
    <View style={{ borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Skeleton width={120} height={16} borderRadius={4} />
        <Skeleton width={160} height={12} borderRadius={4} />
      </View>
      <Skeleton width={80} height={36} borderRadius={12} />
    </View>
  );
}

export function SellerProfileCardSkeleton({ width = 200 }) {
  return (
    <View style={{ width, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' }}>
      <Skeleton width={width} height={80} borderRadius={0} />
      <View style={{ paddingTop: 35, paddingHorizontal: 12, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Skeleton width={width * 0.7} height={14} borderRadius={4} marginBottom={4} />
            <Skeleton width={width * 0.4} height={10} borderRadius={4} />
          </View>
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <Skeleton width={50} height={10} borderRadius={4} />
          <Skeleton width={40} height={10} borderRadius={4} />
          <Skeleton width={35} height={10} borderRadius={4} />
        </View>
        <Skeleton width={width * 0.7} height={10} borderRadius={4} marginBottom={8} />
        <Skeleton width={width * 0.5} height={32} borderRadius={10} marginBottom={8} />
        <Skeleton width={50} height={10} borderRadius={4} marginBottom={6} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Skeleton width={60} height={60} borderRadius={10} />
          <Skeleton width={60} height={60} borderRadius={10} />
          <Skeleton width={60} height={60} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

export function CompactSellerCardSkeleton({ width = SCREEN_WIDTH / 3.5 }) {
  return (
    <View style={{ width, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
      <Skeleton width={40} height={40} borderRadius={20} marginBottom={6} />
      <Skeleton width={width * 0.8} height={12} borderRadius={4} marginBottom={4} />
      <View style={{ flexDirection: 'column', gap: 2 }}>
        <Skeleton width={40} height={10} borderRadius={4} />
        <Skeleton width={35} height={10} borderRadius={4} />
      </View>
    </View>
  );
}