import { useCallback, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
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

/**
 * Resolve color references (e.g., 'colors.iconBackground') to actual color values
 * @param {string} colorRef - Color reference string or direct color value
 * @param {object} colors - Theme colors object
 * @returns {string} Resolved color value
 */
function resolveColor(colorRef, colors) {
  if (typeof colorRef === 'string' && colorRef.startsWith('colors.')) {
    const colorKey = colorRef.replace('colors.', '');
    return colors[colorKey] || colorRef;
  }
  return colorRef;
}
import { EXTRA_PHOTO_SLOTS, MAX_LISTING_PHOTOS, MAX_LISTING_VIDEOS, pickListingPhoto, pickListingVideo } from '../utils/listingPhotos';

const TOTAL_STEPS = 3;
const PHOTO_GAP = 10;
const CONTENT_PAD = 16;

function getPhotoLayout() {
  const gridWidth = Dimensions.get('window').width - CONTENT_PAD * 2;
  // Square main (left) + 2×3 small squares (right); main height = extra grid height
  const smallSize = Math.floor((gridWidth - PHOTO_GAP * 4) / 5);
  const mainSize = smallSize * 3 + PHOTO_GAP * 2;
  return { gridWidth, smallSize, mainSize };
}

const PHOTO_LAYOUT = getPhotoLayout();

const CATEGORIES = [
  { label: 'Mobiles', icon: 'phone-portrait-outline', colorKey: 'category.mobiles' },
  { label: 'Laptops', icon: 'laptop-outline', colorKey: 'category.laptops' },
  { label: 'Electronics', icon: 'headset-outline', colorKey: 'category.electronics' },
  { label: 'Furniture', icon: 'bed-outline', colorKey: 'category.furniture' },
  { label: 'Vehicles', icon: 'car-outline', colorKey: 'category.vehicles' },
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

export default function PostListingScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const priceRef = useRef(null);
  const locationRef = useRef(null);
  const phoneRef = useRef(null);
  const [step, setStep] = useState(1);
  const [pickingIndex, setPickingIndex] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  // Guard against undefined colors
  if (!colors) {
    return null;
  }

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Mobiles');
  const [condition, setCondition] = useState('Good');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');

  const [phone, setPhone] = useState('');
  const [negotiable, setNegotiable] = useState(true);
  const [meetup, setMeetup] = useState('Public place');
  const [hidePhone, setHidePhone] = useState(false);

  const getCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission', 'Allow location access to auto-fill your city.');
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
        Alert.alert('Could not determine location', 'Please enter location manually.');
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
      Alert.alert('Location error', 'Could not fetch location. Please enter manually.');
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
      Alert.alert('Main photo required', 'Add a clear main photo for your listing.');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter a title for your item.');
      return false;
    }
    if (!price.trim()) {
      Alert.alert('Price required', 'Enter a price in NPR.');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Location required', 'Enter your location.');
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
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Could not post listing', error);
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
                                Alert.alert('Video limit', 'Only 1 video allowed. Remove existing first.');
                                return;
                              }
                              if (!mainPhoto) {
                                Alert.alert('Main photo first', 'Please add a main photo before adding video.');
                                return;
                              }
                              pickVideo(slotIndex);
                            }}
                            hitSlop={6}
                          >
                            <View style={styles.extraVideoIconWrap}>
                              <Ionicons name="videocam" size={18} color="#fff" />
                            </View>
                          </Pressable>
                        ) : (
                          <Pressable
                            style={styles.extraSlotPhotoOnly}
                            onPress={() => {
                              if (photoCount >= MAX_LISTING_PHOTOS) {
                                Alert.alert('Limit reached', `You can add up to ${MAX_LISTING_PHOTOS} photos.`);
                                return;
                              }
                              if (!mainPhoto) {
                                Alert.alert('Main photo first', 'Please add a main photo before extra images.');
                                return;
                              }
                              pickPhoto(slotIndex);
                            }}
                            hitSlop={6}
                          >
                            <Ionicons name="image" size={18} color={colors.primary} />
                            <View style={styles.extraPhotoBadge}>
                              <Ionicons name="add" size={9} color={colors.primary} />
                            </View>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              <FloatingField
                label="Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: iPhone 13 128GB"
                colors={colors}
                styles={styles}
                inputRef={titleRef}
                onFocus={() => scrollToFocus(280)}
              />
              <FloatingField
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your item, its condition, features, etc..."
                multiline
                colors={colors}
                styles={styles}
                inputRef={descRef}
                onFocus={() => scrollToFocus(360)}
              />

              <Text style={styles.sectionTitle}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {(CATEGORIES || []).map((item) => {
                  const active = category === item.label;
                  const categoryColor = resolveColor(`colors.${item.colorKey}`, colors);
                  return (
                    <Pressable
                      key={item.label}
                      style={styles.categoryItem}
                      onPress={() => setCategory(item.label)}
                    >
                      <View
                        style={[
                          styles.categoryCircle,
                          { backgroundColor: categoryColor },
                          active && styles.categoryCircleActive,
                        ]}
                      >
                        <Ionicons name={item.icon} size={24} color={colors.onGradient} />
                      </View>
                      <Text style={styles.categoryLabel}>{item.label}</Text>
                      {active && <View style={styles.categoryUnderline} />}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.sectionTitle}>Condition</Text>
              <View style={styles.conditionRow}>
                {(CONDITIONS || []).map((item) => {
                  const active = condition === item;
                  return active ? (
                    <LinearGradient
                      key={item}
                      colors={colors.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.conditionPillActive}
                    >
                      <Pressable onPress={() => setCondition(item)} style={styles.conditionPillInner}>
                        <Text style={styles.conditionTextActive}>{item}</Text>
                      </Pressable>
                    </LinearGradient>
                  ) : (
                    <Pressable key={item} onPress={() => setCondition(item)} style={styles.conditionPill}>
                      <Text style={styles.conditionText}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <FloatingField
                label="Price"
                value={price}
                onChangeText={setPrice}
                placeholder="Enter price"
                keyboardType="numeric"
                colors={colors}
                styles={styles}
                inputRef={priceRef}
                onFocus={() => scrollToFocus(660)}
                left={
                  <View style={styles.currencyBox}>
                    <Text style={styles.currencySymbol}>Rs</Text>
                  </View>
                }
              />

              <FloatingField
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="Enter your location"
                colors={colors}
                styles={styles}
                inputRef={locationRef}
                onFocus={() => scrollToFocus(760)}
                left={<Ionicons name="location-outline" size={20} color={colors.primary} style={styles.inputIcon} />}
                right={
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      if (!locating) {
                        getCurrentLocation();
                      }
                    }}
                    style={locating ? styles.locatingBtn : undefined}
                  >
                    {locating ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="locate" size={20} color={colors.primary} />
                    )}
                  </Pressable>
                }
              />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Contact & Meetup</Text>
              <Text style={styles.stepHint}>Buyers will reach you through chat. Add optional contact details.</Text>

              <FloatingField
                label="Phone (optional)"
                value={phone}
                onChangeText={setPhone}
                placeholder="98XXXXXXXX"
                keyboardType="phone-pad"
                colors={colors}
                styles={styles}
                inputRef={phoneRef}
                onFocus={() => scrollToFocus(240)}
                left={<Text style={styles.phonePrefix}>+977</Text>}
              />

              <View style={styles.toggleCard}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Price negotiable</Text>
                  <Text style={styles.toggleSub}>Allow buyers to make offers</Text>
                </View>
                <Switch
                  value={negotiable}
                  onValueChange={setNegotiable}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>

              <View style={styles.toggleCard}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Hide phone number</Text>
                  <Text style={styles.toggleSub}>Only show phone after you approve</Text>
                </View>
                <Switch
                  value={hidePhone}
                  onValueChange={setHidePhone}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>

              <Text style={styles.sectionTitle}>Preferred meetup</Text>
              <View style={styles.meetupRow}>
                {(MEETUP_OPTIONS || []).map((option) => {
                  const active = meetup === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setMeetup(option)}
                      style={[styles.meetupPill, active && styles.meetupPillActive]}
                    >
                      <Text style={[styles.meetupText, active && styles.meetupTextActive]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewCard}>
                {mainPhoto ? (
                  <Image source={{ uri: mainPhoto }} style={styles.previewImage} />
                ) : (
                  <View style={[styles.previewImage, styles.previewImageEmpty]}>
                    <Ionicons name="image-outline" size={32} color={colors.primary} />
                  </View>
                )}
                <View style={styles.previewBody}>
                  <Text style={styles.previewTitle} numberOfLines={2}>
                    {title || 'Your listing title'}
                  </Text>
                  <Text style={styles.previewPrice}>{previewPrice}</Text>
                  <Text style={styles.previewMeta}>
                    {condition} • {category} • {location || 'Location'}
                  </Text>
                </View>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>Review & Publish</Text>
              <Text style={styles.stepHint}>Check everything looks good before posting.</Text>

              <View style={styles.reviewCard}>
                {mainPhoto ? (
                  <Image source={{ uri: mainPhoto }} style={styles.reviewHero} />
                ) : null}
                <View style={styles.reviewBody}>
                  <Text style={styles.reviewTitle}>{title}</Text>
                  <Text style={styles.reviewPrice}>{previewPrice}</Text>
                  <Text style={styles.reviewLine}>{description || 'No description added'}</Text>
                  <View style={styles.reviewTags}>
                    <View style={styles.reviewTag}>
                      <Text style={styles.reviewTagText}>{category}</Text>
                    </View>
                    <View style={styles.reviewTag}>
                      <Text style={styles.reviewTagText}>{condition}</Text>
                    </View>
                    <View style={styles.reviewTag}>
                      <Text style={styles.reviewTagText}>
                        {photoCount} 📷{videoCount > 0 ? ` • ${videoCount} 🎥` : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reviewLine}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} /> {location}
                  </Text>
                  <Text style={styles.reviewLine}>
                    Meetup: {meetup}
                    {negotiable ? ' • Negotiable' : ''}
                  </Text>
                  {phone ? (
                    <Text style={styles.reviewLine}>Phone: +977 {phone}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.tipCard}>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
                <Text style={styles.tipText}>
                  Meet in public places and never pay before inspecting the item.
                </Text>
              </View>
            </>
          )}

          <Pressable onPress={goNext} disabled={submitting}>
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              {submitting ? (
                <ActivityIndicator color={colors.onGradient} />
              ) : (
                <>
                  <Text style={styles.continueText}>
                    {step === TOTAL_STEPS ? 'Post Listing' : 'Continue'}
                  </Text>
                  <Ionicons
                    name={step === TOTAL_STEPS ? 'checkmark' : 'arrow-forward'}
                    size={20}
                    color={colors.onGradient}
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '800',
    color: colors.onPrimary,
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  progressTrack: {
    marginTop: 18,
    height: 12,
    justifyContent: 'center',
  },
  progressLineBase: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  progressLineActive: {
    position: 'absolute',
    left: 4,
    height: 3,
    borderRadius: 2,
    maxWidth: '96%',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.warningYellow,
  },
  dotDone: {
    backgroundColor: colors.warningYellow,
    borderColor: colors.surface,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.surface,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  photoSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  stepHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
    marginTop: -6,
  },
  photoCount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  photoGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: PHOTO_GAP,
    marginBottom: 22,
    alignSelf: 'center',
  },
  mainPhotoBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.photoBorder,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  mainPhotoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  mainPhotoImage: {
    width: '100%',
    height: '100%',
  },
  mainPhotoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surfaceMutedBorder,
  },
  mainPhotoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  mainPhotoSub: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  extraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PHOTO_GAP,
    justifyContent: 'space-between',
    alignContent: 'flex-start',
  },
  extraBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.photoBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  extraPhotoImage: {
    width: '100%',
    height: '100%',
  },
  extraPlus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.photoPlusBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingWrap: {
    marginBottom: 18,
  },
  floatingLabel: {
    position: 'absolute',
    top: -8,
    left: 14,
    zIndex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  floatingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
  },
  floatingInputRowMultiline: {
    alignItems: 'flex-start',
    minHeight: 110,
    paddingVertical: 8,
  },
  floatingInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  floatingTextarea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  inputIcon: {
    marginLeft: 8,
  },
  currencyBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  phonePrefix: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 20,
    paddingBottom: 14,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryItem: {
    alignItems: 'center',
    width: 64,
  },
  categoryCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCircleActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  categoryLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  categoryUnderline: {
    marginTop: 6,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  conditionPill: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  conditionPillActive: {
    flex: 1,
    height: 48,
    borderRadius: 24,
  },
  conditionPillInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  conditionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  conditionTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  toggleCopy: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  toggleSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  meetupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  meetupPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  meetupPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.iconBackground,
  },
  meetupText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  meetupTextActive: {
    color: colors.primary,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  previewImage: {
    width: 110,
    height: 110,
  },
  previewImageEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconBackground,
  },
  previewBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  previewPrice: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  previewMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  reviewHero: {
    width: '100%',
    height: 200,
  },
  reviewBody: {
    padding: 16,
    gap: 8,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  reviewPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  reviewLine: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  reviewTag: {
    backgroundColor: colors.iconBackground,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reviewTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.photoPlusBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 8,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  mediaCountRow: {
    flexDirection: 'row',
    gap: 6,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.iconBackground,
  },
  countChipVideo: {
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  typeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 3,
  },
  typeBadgeImage: {
    backgroundColor: 'rgba(46, 125, 50, 0.92)',
  },
  typeBadgeVideo: {
    backgroundColor: 'rgba(229, 57, 53, 0.92)',
  },
  typeBadgeSmall: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 7,
    gap: 2,
  },
  typeBadgeImageSmall: {
    backgroundColor: 'rgba(46, 125, 50, 0.92)',
  },
  typeBadgeVideoSmall: {
    backgroundColor: 'rgba(229, 57, 53, 0.92)',
  },
  mainPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  mainPlayIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(229, 57, 53, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  extraPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  mainMediaActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  mediaActionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  mediaActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  extraSlotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    height: '100%',
  },
  extraSlotBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraSlotBtnVideo: {
    backgroundColor: 'rgba(229, 57, 53, 0.14)',
  },
  extraBoxVideo: {
    borderColor: '#E53935',
    backgroundColor: 'rgba(229, 57, 53, 0.04)',
  },
  extraSlotPhotoOnly: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraPhotoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.photoPlusBackground,
  },
  extraSlotVideoOnly: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  extraVideoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  extraVideoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E53935',
  },
  extraVideoSub: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
  },
  locatingBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
});
