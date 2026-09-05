import { useCallback, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Dimensions,
  Image,
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
import { EXTRA_PHOTO_SLOTS, MAX_LISTING_PHOTOS, MAX_LISTING_VIDEOS, pickListingPhoto, pickListingVideo } from '../utils/listingPhotos';

function resolveColor(colorRef, colors) {
  if (typeof colorRef === 'string' && colorRef.startsWith('colors.')) {
    const colorKey = colorRef.replace('colors.', '');
    return colors[colorKey] || colorRef;
  }
  return colorRef;
}

const TOTAL_STEPS = 3;
const PHOTO_GAP = 10;
const CONTENT_PAD = 16;

function getPhotoLayout() {
  const screenWidth = Dimensions.get('window').width;
  const gridWidth = screenWidth - CONTENT_PAD * 2;
  // Main photo takes 60% of width
  const mainSize = Math.floor(gridWidth * 0.6);
  const remainingWidth = gridWidth - mainSize - PHOTO_GAP;
  // Extra photos in 2x2 grid on the right (40% of width)
  const smallSize = Math.floor(remainingWidth / 2);
  return { gridWidth, smallSize, mainSize };
}

const PHOTO_LAYOUT = getPhotoLayout();

const CATEGORIES = [
  { label: 'Mobiles', icon: 'phone-portrait-outline', colorKey: 'category.mobiles' },
  { label: 'Laptops', icon: 'laptop-outline', colorKey: 'category.laptops' },
  { label: 'Electronics', icon: 'headset-outline', colorKey: 'category.electronics' },
  { label: 'Furniture', icon: 'bed-outline', colorKey: 'category.furniture' },
  { label: 'Vehicles', icon: 'car-outline', colorKey: 'category.vehicles' },
  { label: 'Fashion', icon: 'shirt-outline', colorKey: 'category.fashion' },
  { label: 'Sports & Fitness', icon: 'bicycle-outline', colorKey: 'category.sports' },
  { label: 'More', icon: 'grid-outline', colorKey: 'category.more' },
];

const CONDITIONS = ['New', 'Good', 'Fair'];
const MEETUP_OPTIONS = ['Public place', 'Seller location', 'Buyer location'];

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

function ProgressHeader({ step, insets, onBack, colors, styles }) {
  const progressWidth = `${(step / TOTAL_STEPS) * 100}%`;

  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.header, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.onGradient} />
        </Pressable>
        <View style={styles.back} />
      </View>

      <Text style={styles.headerTitle}>Post Your Item</Text>
      <Text style={styles.headerSubtitle}>
        Step {step} of {TOTAL_STEPS}
      </Text>

      <View style={styles.progressTrack}>
        <View style={styles.progressLineBase} />
        <LinearGradient
          colors={[colors.warningYellow, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressLineActive, { width: progressWidth }]}
        />
        <View style={styles.progressDots}>
          {Array.from({ length: TOTAL_STEPS || 3 }).map((_, index) => (
            <View
              key={index}
              style={[
                index + 1 <= step ? styles.dotActive : styles.dot,
                index + 1 < step && styles.dotDone,
              ]}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

export default function IndividualPostListingScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const priceRef = useRef(null);
  const locationRef = useRef(null);
  const [step, setStep] = useState(1);
  const [pickingIndex, setPickingIndex] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  if (!colors) {
    return null;
  }

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Mobiles');
  const [condition, setCondition] = useState('Good');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [negotiable, setNegotiable] = useState(true);
  const [meetup, setMeetup] = useState('Public place');

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

  const mainPhoto = photos[0]?.uri ?? null;
  const extraPhotos = photos.slice(1);

  const handleBack = () => {
    if (step > 1) {
      setStep((value) => value - 1);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const photoCount = photos.filter((p) => p.type !== 'video').length;
  const videoCount = photos.filter((p) => p.type === 'video').length;

  const pickPhoto = async (index) => {
    setPickingIndex(index);
    try {
      const uri = await pickListingPhoto(index === 0 ? 'main' : 'extra');
      if (!uri) {
        return;
      }
      setPhotos((prev) => {
        const next = [...prev];
        next[index] = { id: `${Date.now()}-${index}`, uri, type: 'image' };
        return next.slice(0, MAX_LISTING_PHOTOS + MAX_LISTING_VIDEOS);
      });
    } finally {
      setPickingIndex(null);
    }
  };

  const VIDEO_SLOT_INDEX = EXTRA_PHOTO_SLOTS + 1;

  const pickVideo = async (index) => {
    setPickingIndex(index);
    try {
      const result = await pickListingVideo();
      if (!result) {
        return;
      }
      setPhotos((prev) => {
        const next = [...prev];
        const existingVideoIdx = next.findIndex((p) => p.type === 'video');
        if (existingVideoIdx !== -1 && existingVideoIdx !== VIDEO_SLOT_INDEX) {
          next.splice(existingVideoIdx, 1);
        }
        if (existingVideoIdx === VIDEO_SLOT_INDEX) {
          next.splice(VIDEO_SLOT_INDEX, 1);
        }
        next[VIDEO_SLOT_INDEX] = {
          id: `${Date.now()}-${VIDEO_SLOT_INDEX}`,
          uri: result.uri,
          duration: result.duration,
          type: 'video',
        };
        return next.slice(0, MAX_LISTING_PHOTOS + MAX_LISTING_VIDEOS);
      });
    } finally {
      setPickingIndex(null);
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!mainPhoto) {
      setAlertConfig(showErrorAlert({
        title: 'Main photo required',
        message: 'Add a clear main photo for your listing.',
        onConfirm: () => setAlertConfig(null),
      }));
      return false;
    }
    if (!title.trim()) {
      setAlertConfig(showErrorAlert({
        title: 'Title required',
        message: 'Enter a title for your item.',
        onConfirm: () => setAlertConfig(null),
      }));
      return false;
    }
    if (!price.trim()) {
      setAlertConfig(showErrorAlert({
        title: 'Price required',
        message: 'Enter a price in NPR.',
        onConfirm: () => setAlertConfig(null),
      }));
      return false;
    }
    if (!location.trim()) {
      setAlertConfig(showErrorAlert({
        title: 'Location required',
        message: 'Enter your location.',
        onConfirm: () => setAlertConfig(null),
      }));
      return false;
    }
    return true;
  };

  const goNext = async () => {
    if (step === 1 && !validateStep1()) {
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep((value) => value + 1);
      return;
    }
    if (submitting) {
      return;
    }
    setSubmitting(true);
    
    const { data, error } = await api.createListing({
      title: title.trim(),
      description: description.trim(),
      price,
      category,
      condition,
      photos: photos.map((photo) => photo.uri).filter(Boolean),
      location: location.trim(),
      meetupOption: meetup,
      sellerType: 'individual',
    });
    
    setSubmitting(false);
    if (error) {
      setAlertConfig(showErrorAlert({
        title: 'Could not post listing',
        message: error,
        onConfirm: () => setAlertConfig(null),
      }));
      return;
    }
    navigation.navigate(ROUTES.LISTING_SUCCESS, {
      listing: {
        id: data.listing.id,
        title: data.listing.title,
        price: String(data.listing.price),
        location: data.listing.location,
        imageUrl: data.listing.photos?.[0] || mainPhoto,
        condition: data.listing.condition,
        category: data.listing.category,
      },
    });
  };

  const previewPrice = useMemo(() => {
    const numeric = Number(price.replace(/[^\d]/g, ''));
    if (!numeric) {
      return 'Rs —';
    }
    return `Rs ${numeric.toLocaleString('en-NP')}`;
  }, [price]);

  return (
    <View style={styles.root}>
      <ThemeStatusBar variant="header" />
      <ProgressHeader step={step} insets={insets} onBack={handleBack} colors={colors} styles={styles} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 220 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          scrollEventThrottle={16}
          onScrollBeginDrag={Keyboard.dismiss}
        >
          {step === 1 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.photoSectionTitle}>Add Photos & Video</Text>
                <View style={styles.mediaCountRow}>
                  <View style={styles.countChip}>
                    <Ionicons name="image" size={12} color={colors.primary} />
                    <Text style={styles.countChipText}>
                      {photoCount}/{MAX_LISTING_PHOTOS}
                    </Text>
                  </View>
                  <View style={[styles.countChip, styles.countChipVideo]}>
                    <Ionicons name="videocam" size={12} color="#E53935" />
                    <Text style={[styles.countChipText, { color: '#E53935' }]}>
                      {videoCount}/{MAX_LISTING_VIDEOS}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.photoGrid, { width: PHOTO_LAYOUT.gridWidth }]}>
                <Pressable
                  style={[
                    styles.mainPhotoBox,
                    {
                      width: PHOTO_LAYOUT.mainSize,
                      height: PHOTO_LAYOUT.mainSize,
                    },
                  ]}
                  onPress={() => pickPhoto(0)}
                  disabled={pickingIndex === 0}
                >
                  {mainPhoto ? (
                    <>
                      <Image source={{ uri: mainPhoto }} style={styles.mainPhotoImage} resizeMode="cover" />
                      {photos[0]?.type === 'video' ? (
                        <View style={styles.mainPlayOverlay}>
                          <View style={styles.mainPlayIcon}>
                            <Ionicons name="play" size={28} color="#fff" />
                          </View>
                        </View>
                      ) : null}
                      <View style={[styles.typeBadge, photos[0]?.type === 'video' ? styles.typeBadgeVideo : styles.typeBadgeImage]}>
                        <Ionicons
                          name={photos[0]?.type === 'video' ? 'videocam' : 'image'}
                          size={11}
                          color="#fff"
                        />
                      </View>
                      <Pressable style={styles.removeBadge} onPress={() => removePhoto(0)} hitSlop={8}>
                        <Ionicons name="close" size={14} color={colors.onGradient} />
                      </Pressable>
                    </>
                  ) : pickingIndex === 0 ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <View style={styles.mainPhotoEmpty}>
                      <View style={styles.mainPhotoIconWrap}>
                        <Ionicons name="camera" size={28} color={colors.onGradient} />
                        <View style={styles.mainPhotoBadge}>
                          <Ionicons name="add" size={13} color={colors.primary} />
                        </View>
                      </View>
                      <Text style={styles.mainPhotoTitle}>Add Main Photo</Text>
                      <Text style={styles.mainPhotoSub}>Make it clear and attractive</Text>
                    </View>
                  )}
                </Pressable>

                <View
                  style={[
                    styles.extraGrid,
                    {
                      width: PHOTO_LAYOUT.smallSize * 2 + PHOTO_GAP,
                      height: PHOTO_LAYOUT.mainSize,
                    },
                  ]}
                >
                  {Array.from({ length: EXTRA_PHOTO_SLOTS + 1 || 4 }).map((_, index) => {
                    const isVideoSlot = index === EXTRA_PHOTO_SLOTS;
                    const photo = extraPhotos[index];
                    const slotIndex = index + 1;
                    const loading = pickingIndex === slotIndex;
                    
                    return (
                      <View
                        key={index}
                        style={[
                          styles.extraBox,
                          isVideoSlot && styles.extraBoxVideo,
                          {
                            width: PHOTO_LAYOUT.smallSize,
                            height: PHOTO_LAYOUT.smallSize,
                          },
                        ]}
                      >
                        {photo ? (
                          <>
                            <Image source={{ uri: photo.uri }} style={styles.extraPhotoImage} resizeMode="cover" />
                            {photo.type === 'video' ? (
                              <View style={styles.extraPlayOverlay}>
                                <Ionicons name="play" size={14} color="#fff" />
                              </View>
                            ) : null}
                            <View style={[styles.typeBadgeSmall, photo.type === 'video' ? styles.typeBadgeVideoSmall : styles.typeBadgeImageSmall]}>
                              <Ionicons
                                name={photo.type === 'video' ? 'videocam' : 'image'}
                                size={9}
                                color="#fff"
                              />
                            </View>
                            <Pressable
                              style={styles.removeBadgeSmall}
                              onPress={() => removePhoto(slotIndex)}
                              hitSlop={8}
                            >
                              <Ionicons name="close" size={12} color={colors.onGradient} />
                            </Pressable>
                          </>
                        ) : loading ? (
                          <ActivityIndicator size="small" color={isVideoSlot ? '#E53935' : colors.primary} />
                        ) : isVideoSlot ? (
                          <Pressable
                            style={styles.extraSlotVideoOnly}
                            onPress={() => {
                              if (videoCount >= MAX_LISTING_VIDEOS) {
                                setAlertConfig(showErrorAlert({
                                  title: 'Video limit',
                                  message: 'Only 1 video allowed. Remove existing first.',
                                  onConfirm: () => setAlertConfig(null),
                                }));
                                return;
                              }
                              if (!mainPhoto) {
                                setAlertConfig(showErrorAlert({
                                  title: 'Main photo first',
                                  message: 'Please add a main photo before adding video.',
                                  onConfirm: () => setAlertConfig(null),
                                }));
                                return;
                              }
                              pickVideo(slotIndex);
                            }}
                            hitSlop={6}
                          >
                            <View style={styles.extraVideoIconWrap}>
                              <Ionicons name="videocam" size={18} color="#E53935" />
                            </View>
                            <Text style={styles.extraVideoText}>Add Video</Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            style={styles.extraSlot}
                            onPress={() => pickPhoto(slotIndex)}
                            hitSlop={6}
                          >
                            <Ionicons name="add" size={18} color={colors.primary} />
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Item Details</Text>

              <FloatingField
                label="Title"
                value={title}
                onChangeText={setTitle}
                placeholder="What are you selling?"
                colors={colors}
                styles={styles}
                inputRef={titleRef}
                onFocus={() => scrollToFocus(200)}
              />

              <FloatingField
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your item..."
                multiline
                colors={colors}
                styles={styles}
                inputRef={descRef}
                onFocus={() => scrollToFocus(300)}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => {
                  const categoryColor = resolveColor(`colors.${cat.colorKey}`, colors);
                  return (
                    <Pressable
                      key={cat.label}
                      style={[
                        styles.categoryChip,
                        category === cat.label && styles.categoryChipActive,
                        category === cat.label && { backgroundColor: categoryColor },
                      ]}
                      onPress={() => setCategory(cat.label)}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={18}
                        color={category === cat.label ? colors.onPrimary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat.label && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Condition</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CONDITIONS.map((cond) => (
                  <Pressable
                    key={cond}
                    style={[
                      styles.categoryChip,
                      condition === cond && styles.categoryChipActive,
                    ]}
                    onPress={() => setCondition(cond)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        condition === cond && styles.categoryChipTextActive,
                      ]}
                    >
                      {cond}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <FloatingField
                label="Price (NPR)"
                value={price}
                onChangeText={setPrice}
                placeholder="Enter price"
                keyboardType="numeric"
                colors={colors}
                styles={styles}
                inputRef={priceRef}
                onFocus={() => scrollToFocus(400)}
              />

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Price negotiable</Text>
                <Switch
                  value={negotiable}
                  onValueChange={setNegotiable}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>Location & Meetup</Text>

              <FloatingField
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="Enter your city"
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
                onFocus={() => scrollToFocus(500)}
              />

              <Text style={styles.fieldLabel}>Meetup Option</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {MEETUP_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.categoryChip,
                      meetup === option && styles.categoryChipActive,
                    ]}
                    onPress={() => setMeetup(option)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        meetup === option && styles.categoryChipTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Preview</Text>
                {mainPhoto && (
                  <Image source={{ uri: mainPhoto }} style={styles.previewImage} resizeMode="cover" />
                )}
                <Text style={styles.previewItemTitle}>{title || 'Item Title'}</Text>
                <Text style={styles.previewPrice}>{previewPrice}</Text>
                <Text style={styles.previewLocation}>{location || 'Location'}</Text>
              </View>
            </>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
          <Pressable
            style={styles.continueBtn}
            onPress={goNext}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.continueBtnText}>
                {step === TOTAL_STEPS ? 'Publish' : 'Continue'}
              </Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  back: {
    width: 36,
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
  progressTrack: {
    position: 'relative',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 16,
  },
  progressLineBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressLineActive: {
    height: 4,
    borderRadius: 2,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: colors.warningYellow,
  },
  dotDone: {
    backgroundColor: colors.surface,
  },
  content: {
    paddingTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  mediaCountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.iconBackground,
  },
  countChipVideo: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  countChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  photoGrid: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  mainPhotoBox: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.iconBackground,
  },
  mainPhotoImage: {
    width: '100%',
    height: '100%',
  },
  mainPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  typeBadgeImage: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  typeBadgeVideo: {
    backgroundColor: '#E53935',
  },
  removeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPhotoEmpty: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  mainPhotoIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPhotoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onGradient,
    marginBottom: 4,
  },
  mainPhotoSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  extraGrid: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  extraBox: {
    backgroundColor: colors.iconBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  extraBoxVideo: {
    backgroundColor: 'rgba(229, 57, 53, 0.05)',
  },
  extraPhotoImage: {
    width: '100%',
    height: '100%',
  },
  extraPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeSmall: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  typeBadgeImageSmall: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  typeBadgeVideoSmall: {
    backgroundColor: '#E53935',
  },
  removeBadgeSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraSlot: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconBackground,
    borderRadius: 12,
  },
  extraSlotVideoOnly: {
    backgroundColor: 'rgba(229, 57, 53, 0.05)',
  },
  extraVideoIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  extraVideoText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#E53935',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
  previewCard: {
    backgroundColor: colors.iconBackground,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  previewItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  previewLocation: {
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
  continueBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});