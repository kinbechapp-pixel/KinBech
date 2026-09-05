import { useCallback, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '../navigation/helpers';
import { api } from '../services/api';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';
import { AlertModal, showErrorAlert, showSuccessAlert } from '../components/AlertModal';

const CATEGORIES = [
  'Grocery & Kirana',
  'Electronics',
  'Clothing & Fashion',
  'Furniture & Home',
  'Medical & Pharmacy',
  'Food & Restaurant',
  'Books & Stationery',
  'Sports & Fitness',
  'Automotive',
  'Beauty & Personal Care',
  'Jewelry & Accessories',
  'Hardware & Tools',
  'Pet Supplies',
  'Toys & Games',
  'Other'
];

function FloatingField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  left,
  right,
  colors,
  styles,
  onFocus,
  inputRef,
}) {
  return (
    <View style={styles.floatingWrap}>
      <Text style={styles.floatingLabel}>{label}</Text>
      <View style={[styles.floatingInputRow, multiline && styles.floatingInputRowMultiline]}>
        {left}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline={multiline}
          keyboardType={keyboardType}
          onFocus={onFocus}
          style={[styles.floatingInput, multiline && styles.floatingTextarea]}
        />
        {right}
      </View>
    </View>
  );
}

export default function CreateShopScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const nameRef = useRef(null);
  const descRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const locationRef = useRef(null);
  const hoursRef = useRef(null);
  const { category: initialCategory } = route.params || {};

  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState(initialCategory || 'Mobiles');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [openingHours, setOpeningHours] = useState('9:00 AM - 8:00 PM');

  const getCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAlertConfig(showErrorAlert({
          title: 'Location permission',
          message: 'Allow location access to auto-fill your city.',
          onConfirm: () => setAlertConfig(null),
        }));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const addr = geocode?.[0];
      if (!addr) {
        setAlertConfig(showErrorAlert({
          title: 'Could not determine location',
          message: 'Please enter location manually.',
          onConfirm: () => setAlertConfig(null),
        }));
        return;
      }
      const city = addr.city || addr.subregion || addr.district || '';
      const district = addr.district || addr.subregion || '';
      const parts = [];
      if (city && city !== district) {
        parts.push(city);
      }
      if (district && !parts.includes(district)) {
        parts.push(district);
      }
      if (parts.length === 0) {
        parts.push(addr.region || addr.subregion || 'Kathmandu');
      }
      setLocation(parts.join(', '));
    } catch (e) {
      setAlertConfig(showErrorAlert({
        title: 'Location error',
        message: 'Could not fetch location. Please enter manually.',
        onConfirm: () => setAlertConfig(null),
      }));
    } finally {
      setLocating(false);
    }
  }, []);

  const scrollToFocus = useCallback((y) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
    }, 120);
  }, []);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setAlertConfig(showErrorAlert({
        title: 'Shop name required',
        message: 'Enter your shop name.',
        onConfirm: () => setAlertConfig(null),
      }));
      return;
    }

    if (!category) {
      setAlertConfig(showErrorAlert({
        title: 'Category required',
        message: 'Select your business category.',
        onConfirm: () => setAlertConfig(null),
      }));
      return;
    }

    if (!location.trim()) {
      setAlertConfig(showErrorAlert({
        title: 'Location required',
        message: 'Enter your shop location.',
        onConfirm: () => setAlertConfig(null),
      }));
      return;
    }

    setSubmitting(true);

    const { data, error } = await api.createShop({
      name: name.trim(),
      category,
      description: description.trim(),
      phone: phone.trim(),
      address: address.trim(),
      location: location.trim(),
      openingHours,
    });

    setSubmitting(false);

    if (error) {
      setAlertConfig(showErrorAlert({
        title: 'Could not create shop',
        message: error,
        onConfirm: () => setAlertConfig(null),
      }));
      return;
    }

    setAlertConfig(showSuccessAlert({
      title: 'Shop Created!',
      message: 'Your shop has been created successfully. You can now add products.',
      onConfirm: () => {
        setAlertConfig(null);
        navigation.navigate(ROUTES.SHOP_POST_LISTING);
      },
    }));
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
        <View style={styles.headerTop}>
          <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.onGradient} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <Text style={styles.headerTitle}>Create Your Shop</Text>
        <Text style={styles.headerSubtitle}>Set up your business profile</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Text style={styles.sectionTitle}>Shop Information</Text>

          <FloatingField
            label="Shop Name"
            value={name}
            onChangeText={setName}
            placeholder="Your business name"
            colors={colors}
            styles={styles}
            inputRef={nameRef}
            onFocus={() => scrollToFocus(200)}
          />

          <Text style={styles.fieldLabel}>Business Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <FloatingField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Tell customers about your business..."
            multiline
            colors={colors}
            styles={styles}
            inputRef={descRef}
            onFocus={() => scrollToFocus(300)}
          />

          <FloatingField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Contact number"
            keyboardType="phone-pad"
            colors={colors}
            styles={styles}
            inputRef={phoneRef}
            onFocus={() => scrollToFocus(400)}
          />

          <FloatingField
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Street address"
            colors={colors}
            styles={styles}
            inputRef={addressRef}
            onFocus={() => scrollToFocus(500)}
          />

          <FloatingField
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="City/Area"
            right={
              <Pressable onPress={getCurrentLocation} disabled={locating}>
                {locating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="location" size={20} color={colors.primary} />
                )}
              </Pressable>
            }
            colors={colors}
            styles={styles}
            inputRef={locationRef}
            onFocus={() => scrollToFocus(600)}
          />

          <FloatingField
            label="Opening Hours"
            value={openingHours}
            onChangeText={setOpeningHours}
            placeholder="e.g., 9:00 AM - 8:00 PM"
            colors={colors}
            styles={styles}
            inputRef={hoursRef}
            onFocus={() => scrollToFocus(700)}
          />

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              You can update these details later from your shop profile.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
          <Pressable
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.submitBtnText}>Create Shop</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {alertConfig && (
        <AlertModal
          title={alertConfig.title}
          message={alertConfig.message}
          onConfirm={alertConfig.onConfirm}
        />
      )}
    </View>
  );
}

const createStyles = (colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: { flex: 1 },
  header: {
    backgroundColor: colors.gradientStart,
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.onGradient,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  content: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.iconBackground,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.onPrimary,
  },
  floatingWrap: {
    marginBottom: 16,
  },
  floatingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  floatingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.iconBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  floatingInputRowMultiline: {
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  floatingInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  floatingTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.iconBackground,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});