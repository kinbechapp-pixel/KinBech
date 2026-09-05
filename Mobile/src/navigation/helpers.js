export const ROUTES = {
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  OTP: 'OtpVerification',
  PROFILE_SETUP: 'ProfileSetup',
  MAIN_TABS: 'MainTabs',
  ALL_CATEGORIES: 'AllCategories',
  EXPLORE: 'Explore',
  SEARCH_RESULTS: 'SearchResults',
  ITEM_DETAIL: 'ItemDetail',
  POST_LISTING: 'PostListing',
  EDIT_LISTING: 'EditListing',
  MY_LISTINGS: 'MyListings',
  LISTING_SUCCESS: 'ListingSuccess',
  CHAT: 'Chat',
  SETTINGS: 'Settings',
  WISHLIST: 'Wishlist',
  NOTIFICATIONS: 'Notifications',
  RATE_REVIEW: 'RateReview',
  REPORT_BLOCK: 'ReportBlockUser',
  MEETUP: 'MeetupConfirmation',
  HELP: 'HelpSupport',
  EMPTY_STATE: 'EmptyState',
  INFO: 'Info',
  SELLER_PROFILE: 'SellerProfile',
  EDIT_PROFILE: 'EditProfile',
  PRIVACY: 'Privacy',
  LANGUAGE_SELECT: 'LanguageSelect',
  CURRENCY_SELECT: 'CurrencySelect',
  TERMS: 'Terms',
  PRIVACY_POLICY: 'PrivacyPolicy',
  // Seller type routes
  SELLER_TYPE_SELECTION: 'SellerTypeSelection',
  STORE_CATEGORY_SELECTION: 'StoreCategorySelection',
  INDIVIDUAL_POST_LISTING: 'IndividualPostListing',
  SHOP_POST_LISTING: 'ShopPostListing',
  CREATE_SHOP: 'CreateShop',
  SHOP_PROFILE: 'ShopProfile',
};

export const TABS = {
  HOME: 'Home',
  EXPLORE: 'Explore',
  POST: 'Post',
  CHATS: 'Chats',
  PROFILE: 'Profile',
};

export function navigateToTab(navigation, screen, params) {
  navigation.navigate(ROUTES.MAIN_TABS, { screen, params });
}

export function openItemDetail(listingId) {
  return (navigation) => {
    navigation.navigate(ROUTES.ITEM_DETAIL, { listingId });
  };
}

export const HELP_CATEGORY_COPY = {
  account: {
    title: 'Account Issues',
    body: 'Manage profile details, login problems, and account settings from this section once connected to the backend.',
  },
  payments: {
    title: 'Payments',
    body: 'Learn about supported payment methods, refunds, and transaction history for KinBech.',
  },
  safety: {
    title: 'Safety Tips',
    body: 'Meet in public places, inspect items before paying, and keep conversations inside the app.',
  },
  report: {
    title: 'Report a Problem',
    body: 'Use report options on listings or chats to flag scams, fake items, or abusive behaviour.',
  },
};

export const INFO_COPY = {
  EditProfile: {
    title: 'Edit Profile',
    body: 'Update your name, photo, and contact details here in the full release.',
  },
  Privacy: {
    title: 'Privacy & Security',
    body: 'Control who can see your profile and manage blocked users.',
  },
  Addresses: {
    title: 'Saved Addresses',
    body: 'Coming soon — save pickup and delivery locations to make posting and meetups even faster.',
  },
  PaymentMethods: {
    title: 'Payment Methods',
    body: 'Coming soon — connect eSewa, Khalti, IME Pay, Indian wallets, or bank accounts for seamless in-app payments.',
  },
  ContactUs: {
    title: 'Contact Us',
    body: 'Reach KinBech support anytime. Use the chat option for the fastest response.',
    buttonLabel: 'Open Chat',
    buttonRoute: ROUTES.CHAT,
  },
  Terms: {
    title: 'Terms & Conditions',
    body: 'Marketplace terms and seller/buyer responsibilities will appear here.',
  },
  PrivacyPolicy: {
    title: 'Privacy Policy',
    body: 'How KinBech collects and protects your data will be documented here.',
  },
  LanguageSelect: {
    title: 'Language',
    body: 'English, Nepali, and Hindi language options will be available soon.',
  },
  CurrencySelect: {
    title: 'Currency',
    body: 'NPR (Rs) will be the default currency for Nepal.',
  },
  Wallet: {
    title: 'Wallet',
    body: 'Your balance, payouts, and transaction history will show here.',
    buttonLabel: 'Browse Deals',
    buttonTab: TABS.HOME,
  },
  Transactions: {
    title: 'All Transactions',
    body: 'View your complete purchase and sales history.',
    buttonLabel: 'My Listings',
    buttonRoute: ROUTES.MY_LISTINGS,
  },
  MapView: {
    title: 'Map View',
    body: 'See the meetup location on the map before you go.',
    buttonRoute: ROUTES.MEETUP,
    buttonLabel: 'Confirm Meetup',
  },
  SafetyTips: {
    title: 'Stay Safe',
    body: 'Meet in public places, bring a friend when possible, and never pay before inspecting the item.',
    buttonRoute: ROUTES.HELP,
    buttonLabel: 'Help Center',
  },
  Article: {
    title: 'Tips for Safe Buying & Selling',
    body: 'Verify listings, chat in-app, meet safely, and leave honest reviews after a deal.',
  },
  AllFaqs: {
    title: 'All FAQs',
    body: 'Browse common questions about accounts, listings, payments, and safety.',
    buttonRoute: ROUTES.HELP,
    buttonLabel: 'Back to Help',
  },
};
