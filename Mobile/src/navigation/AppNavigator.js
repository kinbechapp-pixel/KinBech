import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';

import BottomTabBar from '../components/BottomTabBar';
import { useTheme } from '../theme';
import AllCategoriesScreen from '../screens/AllCategoriesScreen';
import CategoryScreen from '../screens/CategoryScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import EditListingScreen from '../screens/EditListingScreen';
import EmptyStateScreen from '../screens/EmptyStateScreen';
import ExploreScreen from '../screens/ExploreScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import HomeScreen from '../screens/HomeScreen';
import InfoScreen from '../screens/InfoScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import ListingSuccessScreen from '../screens/ListingSuccessScreen';
import LoginScreen from '../screens/LoginScreen';
import MeetupConfirmationScreen from '../screens/MeetupConfirmationScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import PostListingScreen from '../screens/PostListingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import RateReviewScreen from '../screens/RateReviewScreen';
import ReportBlockUserScreen from '../screens/ReportBlockUserScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SplashScreen from '../screens/SplashScreen';
import WishlistScreen from '../screens/WishlistScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name="Post" component={PostListingScreen} options={{ title: 'Sell' }} />
      <Tab.Screen name="Chats" component={ChatListScreen} options={{ title: 'Chats' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.badge,
        header: colors.surface,
        headerTitle: colors.text,
      },
    };
  }, [colors, isDark]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade_from_bottom',
          animationDuration: 320,
          presentation: 'card',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
          orientation: 'portrait',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />

        <Stack.Screen name="AllCategories" component={AllCategoriesScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen
          name="ItemDetail"
          component={ItemDetailScreen}
          options={({ route: navRoute }) => ({
            animation: 'default',
            animationDuration: 380,
            presentation: 'card',
            fullScreenGestureEnabled: true,
            sharedElements: () => {
              const sharedId = navRoute?.params?.sharedId;
              if (!sharedId) return [];
              return [
                {
                  id: `item.${sharedId}.photo`,
                  animation: 'move',
                  resize: 'cover',
                },
                {
                  id: `item.${sharedId}.title`,
                  animation: 'fade',
                },
                {
                  id: `item.${sharedId}.price`,
                  animation: 'fade',
                },
              ];
            },
          })}
        />
        <Stack.Screen name="PostListing" component={PostListingScreen} />
        <Stack.Screen name="EditListing" component={EditListingScreen} />
        <Stack.Screen name="MyListings" component={MyListingsScreen} />
        <Stack.Screen name="ListingSuccess" component={ListingSuccessScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="RateReview" component={RateReviewScreen} />
        <Stack.Screen name="ReportBlockUser" component={ReportBlockUserScreen} />
        <Stack.Screen name="MeetupConfirmation" component={MeetupConfirmationScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="EmptyState" component={EmptyStateScreen} />
        <Stack.Screen name="Info" component={InfoScreen} />
        <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
