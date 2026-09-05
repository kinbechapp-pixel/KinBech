import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientButton from '../components/GradientButton';
import { navigateToTab } from '../navigation/helpers';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

const createStyles = (colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onGradient,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    alignSelf: 'stretch',
  },
});

export default function InfoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    title = 'KinBech',
    body = 'More details will appear here.',
    buttonLabel,
    buttonRoute,
    buttonTab,
  } = route.params ?? {};

  const handlePress = () => {
    if (buttonTab) {
      navigateToTab(navigation, buttonTab);
      return;
    }
    if (buttonRoute) {
      navigation.navigate(buttonRoute);
      return;
    }
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <ThemeStatusBar variant="header" />
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.onGradient} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.back} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="information-circle" size={42} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {buttonLabel ? (
          <GradientButton title={buttonLabel} onPress={handlePress} style={styles.button} />
        ) : null}
      </ScrollView>
    </View>
  );
}
