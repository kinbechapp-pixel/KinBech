import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../navigation/helpers';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

const createStyles = (colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function PostListingScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  useEffect(() => {
    // Check user's seller type preference
    const sellerTypePreference = user?.sellerTypePreference || 'individual';
    
    if (sellerTypePreference === 'shop') {
      // If user prefers shop, check if they have a shop
      navigation.navigate(ROUTES.SHOP_POST_LISTING);
    } else if (sellerTypePreference === 'individual') {
      // If user prefers individual, go directly to individual post
      navigation.navigate(ROUTES.INDIVIDUAL_POST_LISTING);
    } else {
      // If 'both' or not set, show selection screen
      navigation.navigate(ROUTES.SELLER_TYPE_SELECTION);
    }
  }, [user, navigation]);

  return (
    <View style={styles.root}>
      <ThemeStatusBar variant="header" />
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}