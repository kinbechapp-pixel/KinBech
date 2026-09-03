import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../navigation/helpers';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

export default function SplashScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { ready, isLoggedIn, onboarded } = useAuth();

  useEffect(() => {
    if (!ready) {
      return undefined;
    }

    const timer = setTimeout(() => {
      if (isLoggedIn) {
        navigation.replace(ROUTES.MAIN_TABS);
        return;
      }
      navigation.replace(onboarded ? ROUTES.LOGIN : ROUTES.ONBOARDING);
    }, 1200);

    return () => clearTimeout(timer);
  }, [ready, isLoggedIn, onboarded, navigation]);

  return (
    <LinearGradient
      colors={colors.gradientSplash || ['#050512', '#13103A', '#5B39C6']}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <ThemeStatusBar variant="header" />
      <Text style={[styles.spark, { top: '16%', left: '16%' }]}>✦</Text>
      <Text style={[styles.spark, { top: '20%', right: '14%', fontSize: 10 }]}>✦</Text>
      <Text style={[styles.spark, { top: '38%', left: '10%', fontSize: 8 }]}>○</Text>
      <Text style={[styles.spark, { top: '42%', right: '12%', fontSize: 8 }]}>○</Text>
      <Text style={[styles.spark, { bottom: '28%', left: '22%', fontSize: 12 }]}>✦</Text>
      <Text style={[styles.spark, { bottom: '22%', right: '18%', fontSize: 9 }]}>✦</Text>
      <View style={[styles.dotGrid, { top: 48, right: 28 }]} />
      <View style={[styles.dotGrid, { bottom: 90, left: 24 }]} />

      <View style={styles.center}>
        <BrandLogo size={132} />
        <Text style={styles.logo}>KinBech</Text>
        <Text style={styles.tagline}>Buy. Sell. Save.</Text>
      </View>

      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </LinearGradient>
  );
}

const createStyles = (colors) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
  },
  logo: {
    marginTop: 22,
    fontSize: 36,
    fontWeight: '800',
    color: colors.onGradient,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: colors.onGradient,
    opacity: 0.95,
  },
  dots: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: colors.onGradient,
  },
  spark: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
  },
  dotGrid: {
    position: 'absolute',
    width: 54,
    height: 54,
    opacity: 0.25,
    borderWidth: 1,
    borderColor: colors.onGradient,
    borderStyle: 'dotted',
    borderRadius: 8,
  },
});
