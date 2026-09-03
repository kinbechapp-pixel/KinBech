import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '../navigation/helpers';
import { useAuth } from '../context/AuthContext';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Buy Anything,\nAnywhere',
    body: 'Find great second-hand items near you. Save money, help others, and make smart choices.',
    icon: 'storefront-outline',
    image: null,
  },
  {
    title: 'Sell With\nEase',
    body: 'Snap a photo, set your price, and post your listing in seconds. Reach buyers near you instantly.',
    icon: 'pricetags-outline',
    image: null,
  },
  {
    title: 'Chat &\nConnect Safely',
    body: "Message sellers directly, negotiate prices, and meet safely. We've got your back every step.",
    icon: 'shield-checkmark-outline',
    image: null,
  },
];

const createStyles = (colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  skipBtn: {
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 10,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  pager: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 28,
    paddingTop: 64,
    alignItems: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: 320,
    marginBottom: 24,
  },
  illustrationWrap: {
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  illustrationCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.iconBackground,
  },
  illustrationBadge: {
    width: 140,
    height: 140,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 10,
    left: 30,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 30,
    right: 20,
  },
  sparkleBottom: {
    position: 'absolute',
    bottom: 24,
    left: 50,
  },
  sparkleGlyph: {
    fontSize: 16,
    color: colors.primary,
    opacity: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 40,
  },
  body: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    height: 8,
    borderRadius: 4,
  },
  nextWrap: {
    marginHorizontal: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 18,
  },
  nextText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onGradient,
  },
});

function Illustration({ icon }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.illustrationWrap}>
      <View style={styles.illustrationCircle} />
      <View style={styles.sparkleTopLeft}>
        <Text style={styles.sparkleGlyph}>✦</Text>
      </View>
      <View style={styles.sparkleTopRight}>
        <Text style={styles.sparkleGlyph}>✦</Text>
      </View>
      <View style={styles.sparkleBottom}>
        <Text style={[styles.sparkleGlyph, { fontSize: 12 }]}>✦</Text>
      </View>

      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.illustrationBadge}
      >
        <Ionicons name={icon} size={64} color={colors.onGradient} />
      </LinearGradient>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  // Guard against undefined colors
  if (!colors) {
    return null;
  }

  const isLast = index === SLIDES.length - 1;
  const { completeOnboarding } = useAuth();

  const scrollRef = useRef(null);

  const goToSlide = (i) => {
    scrollRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: true });
    setIndex(i);
  };

  const onScroll = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== index) setIndex(newIndex);
  };

  const goLogin = async () => {
    await completeOnboarding();
    navigation.replace(ROUTES.LOGIN);
  };

  const onNext = () => {
    if (isLast) {
      goLogin();
    } else {
      goToSlide(index + 1);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ThemeStatusBar />

      <Pressable
        style={styles.skipBtn}
        onPress={goLogin}
        hitSlop={10}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {(SLIDES || []).map((slide) => (
          <View key={slide.title} style={styles.slide}>
            {slide.image ? (
              <Image source={slide.image} style={styles.illustrationImage} resizeMode="contain" />
            ) : (
              <Illustration icon={slide.icon} />
            )}

            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {(SLIDES || []).map((_, i) =>
          i === index ? (
            <LinearGradient
              key={i}
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dotActive}
            />
          ) : (
            <View key={i} style={styles.dot} />
          )
        )}
      </View>

      <Pressable
        onPress={onNext}
        style={[styles.nextWrap, { marginBottom: Math.max(insets.bottom, 20) }]}
      >
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.nextButton}
        >
          <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.onGradient} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
