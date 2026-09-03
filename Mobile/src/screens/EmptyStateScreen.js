import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../components/EmptyState';
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
});

export default function EmptyStateScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    title = 'Nothing here yet',
    body = 'This section is empty for now.',
    buttonLabel,
    buttonRoute,
    buttonTab,
    showIllustration = true,
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
    <SafeAreaView style={styles.root} edges={['top']}>
      <ThemeStatusBar variant="header" />
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.onGradient} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.back} />
      </LinearGradient>

      <EmptyState
        title={title}
        body={body}
        buttonLabel={buttonLabel}
        onButtonPress={handlePress}
        showIllustration={showIllustration}
      />
    </SafeAreaView>
  );
}
