import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandLogo from '../components/BrandLogo';
import GradientButton from '../components/GradientButton';
import { AlertModal, showErrorAlert } from '../components/AlertModal';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../navigation/helpers';
import { api } from '../services/api';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

const createStyles = (colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 36,
  },
  brand: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '800',
    color: colors.onGradient,
  },
  welcome: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: '800',
    color: colors.onGradient,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
  },
  sheet: {
    flex: 1,
    marginTop: -20,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
  },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.inputBackground,
  },
  inputDisabled: {
    backgroundColor: colors.iconBackground,
    color: colors.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.iconBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  sellerTypeSection: {
    marginTop: 12,
  },
  sellerTypeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sellerTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.iconBackground,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  sellerTypeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sellerTypeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerTypeRadioSelected: {
    borderColor: colors.onPrimary,
  },
  sellerTypeRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  sellerTypeRadioInnerSelected: {
    backgroundColor: colors.onPrimary,
  },
  sellerTypeContent: {
    flex: 1,
  },
  sellerTypeOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  sellerTypeOptionTitleSelected: {
    color: colors.onPrimary,
  },
  sellerTypeOptionDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sellerTypeOptionDescSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
});

export default function ProfileSetupScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user, saveSession } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || '');
  const [sellerTypePreference, setSellerTypePreference] = useState('individual');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertConfig(showErrorAlert({
          title: 'Permission Required',
          message: 'Please grant camera roll permissions to upload a profile photo.',
          onConfirm: () => setAlertConfig(null),
        }));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      setAlertConfig(showErrorAlert({
        title: 'Error',
        message: 'Failed to pick image. Please try again.',
        onConfirm: () => setAlertConfig(null),
      }));
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAlertConfig(showErrorAlert({
          title: 'Permission Required',
          message: 'Please grant location permissions to set your current location.',
          onConfirm: () => setAlertConfig(null),
        }));
        setLocationLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      
      // Reverse geocoding to get location name
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      const locationName = reverseGeocode[0] 
        ? `${reverseGeocode[0].city || reverseGeocode[0].subregion || ''}, ${reverseGeocode[0].country || ''}`
        : 'Unknown Location';
      
      setLocation(locationName);
      setCoordinates({ latitude, longitude });
      setLocationLoading(false);
    } catch (error) {
      setLocationLoading(false);
      setAlertConfig(showErrorAlert({
        title: 'Location Error',
        message: 'Failed to get your location. Please enter it manually.',
        onConfirm: () => setAlertConfig(null),
      }));
    }
  };

  const completeProfile = async () => {
    if (!name.trim()) {
      setAlertConfig(showErrorAlert({
        title: 'Name Required',
        message: 'Please enter your name to continue.',
        onConfirm: () => setAlertConfig(null),
      }));
      return;
    }
    if (!location.trim()) {
      setAlertConfig(showErrorAlert({
        title: 'Location Required',
        message: 'Please enter your location to continue.',
        onConfirm: () => setAlertConfig(null),
      }));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.updateProfile({
        name: name.trim(),
        location: location.trim(),
        avatarUrl: avatarUri,
        coordinates: coordinates,
        sellerTypePreference: sellerTypePreference,
      });

      setLoading(false);
      if (error) {
        setAlertConfig(showErrorAlert({
          title: 'Update Failed',
          message: error,
          onConfirm: () => setAlertConfig(null),
        }));
        return;
      }

      await saveSession(data.token, data.user);
      navigation.replace(ROUTES.MAIN_TABS);
    } catch (error) {
      setLoading(false);
      setAlertConfig(showErrorAlert({
        title: 'Error',
        message: 'Failed to complete profile. Please try again.',
        onConfirm: () => setAlertConfig(null),
      }));
    }
  };

  return (
    <View style={styles.root}>
      <ThemeStatusBar variant="header" />
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <BrandLogo size={78} />
        <Text style={styles.brand}>KinBech</Text>
        <Text style={styles.welcome}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Add your details to get started</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <Pressable onPress={pickImage} style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarEmpty}>
                  <Ionicons name="person" size={40} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color={colors.onGradient} />
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tap to add profile photo</Text>
          </View>

          <Text style={styles.label}>Your Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={phone}
            editable={false}
            style={[styles.input, styles.inputDisabled]}
          />

          <Text style={styles.label}>Current Location</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Enter your location"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
          <View style={styles.locationRow}>
            <Pressable onPress={getCurrentLocation} style={styles.locationButton} disabled={locationLoading}>
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="location" size={16} color={colors.primary} />
                  <Text style={styles.locationButtonText}>Use Current Location</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.sellerTypeSection}>
            <Text style={styles.sellerTypeTitle}>How do you want to sell?</Text>
            
            <Pressable
              style={[
                styles.sellerTypeOption,
                sellerTypePreference === 'individual' && styles.sellerTypeOptionSelected
              ]}
              onPress={() => setSellerTypePreference('individual')}
            >
              <View style={[
                styles.sellerTypeRadio,
                sellerTypePreference === 'individual' && styles.sellerTypeRadioSelected
              ]}>
                {sellerTypePreference === 'individual' && (
                  <View style={[
                    styles.sellerTypeRadioInner,
                    styles.sellerTypeRadioInnerSelected
                  ]} />
                )}
              </View>
              <View style={styles.sellerTypeContent}>
                <Text style={[
                  styles.sellerTypeOptionTitle,
                  sellerTypePreference === 'individual' && styles.sellerTypeOptionTitleSelected
                ]}>
                  👤 Individual Seller
                </Text>
                <Text style={[
                  styles.sellerTypeOptionDesc,
                  sellerTypePreference === 'individual' && styles.sellerTypeOptionDescSelected
                ]}>
                  Sell personal items like used phones, furniture, etc.
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.sellerTypeOption,
                sellerTypePreference === 'shop' && styles.sellerTypeOptionSelected
              ]}
              onPress={() => setSellerTypePreference('shop')}
            >
              <View style={[
                styles.sellerTypeRadio,
                sellerTypePreference === 'shop' && styles.sellerTypeRadioSelected
              ]}>
                {sellerTypePreference === 'shop' && (
                  <View style={[
                    styles.sellerTypeRadioInner,
                    styles.sellerTypeRadioInnerSelected
                  ]} />
                )}
              </View>
              <View style={styles.sellerTypeContent}>
                <Text style={[
                  styles.sellerTypeOptionTitle,
                  sellerTypePreference === 'shop' && styles.sellerTypeOptionTitleSelected
                ]}>
                  🏪 Shop Owner
                </Text>
                <Text style={[
                  styles.sellerTypeOptionDesc,
                  sellerTypePreference === 'shop' && styles.sellerTypeOptionDescSelected
                ]}>
                  Run a business and sell products with reviews & ratings
                </Text>
              </View>
            </Pressable>
          </View>

          <GradientButton
            title={loading ? 'Please wait...' : 'Complete Profile'}
            icon="arrow-forward"
            disabled={loading}
            onPress={completeProfile}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={!!alertConfig}
        onClose={() => setAlertConfig(null)}
        {...(alertConfig || {})}
      />
    </View>
  );
}
