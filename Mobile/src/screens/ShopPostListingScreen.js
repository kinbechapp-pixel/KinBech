import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '../navigation/helpers';
import { api } from '../services/api';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';
import { AlertModal, showErrorAlert, showSuccessAlert } from '../components/AlertModal';
import { EXTRA_PHOTO_SLOTS, MAX_LISTING_PHOTOS, pickListingPhoto } from '../utils/listingPhotos';

function resolveColor(colorRef, colors) {
  if (typeof colorRef === 'string' && colorRef.startsWith('colors.')) {
    const colorKey = colorRef.replace('colors.', '');
    return colors[colorKey] || colorRef;
  }
  return colorRef;
}

const TOTAL_STEPS = 4;
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

      <Text style={styles.headerTitle}>Post Shop Product</Text>
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
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
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

export default function ShopPostListingScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const priceRef = useRef(null);
  const stockRef = useRef(null);
  const brandRef = useRef(null);
  const skuRef = useRef(null);
  const [step, setStep] = useState(1);
  const [pickingIndex, setPickingIndex] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);
  const [userShop, setUserShop] = useState(null);
  const [loadingShop, setLoadingShop] = useState(true);

  if (!colors) {
    return null;
  }

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Mobiles');
  const [condition, setCondition] = useState('New');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [isOnSale, setIsOnSale] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState(null);

  // Fetch user's shop on mount
  useEffect(() => {
    fetchUserShop();
  }, []);

  const fetchUserShop = async () => {
    try {
      setLoadingShop(true);
      const { data, error } = await api.getMyShop();
      if (error) {
        console.log('No shop found, will redirect to create shop');
      } else if (data.shop) {
        setUserShop(data.shop);
        setSelectedShopId(data.shop._id);
      }
    } catch (error) {
      console.log('Error fetching shop:', error);
    } finally {
      setLoadingShop(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((value) => value - 1);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const mainPhoto = photos[0]?.uri ?? null;
  const extraPhotos = photos.slice(1);

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
        return next.slice(0, MAX_LISTING_PHOTOS);
      });
    } finally {
      setPickingIndex(null);
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!userShop) {
      Alert.alert(
        'No Shop Found',
        'You need to create a shop first to post shop products.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Shop', onPress: () => navigation.navigate(ROUTES.CREATE_SHOP) }
        ]
      );
      return false;
    }
    if (!mainPhoto) {
      setAlertConfig(showErrorAlert({
        title: 'Main photo required',
        message: 'Add a clear main photo for your product.',
        onConfirm: () => setAlertConfig(null),
      }));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!title.trim()) {
      setAlertConfig(showErrorAlert({
        title: 'Title required',
        message: 'Enter a title for your product.',
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
    if (!stock || stock < 1) {
      setAlertConfig(showErrorAlert({
        title: 'Stock required',
        message: 'Enter available stock quantity.',
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
    if (step === 2 && !validateStep2()) {
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
      sellerType: 'shop',
      shopId: selectedShopId,
      stock: Number(stock),
      brand: brand.trim(),
      sku: sku.trim(),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      isOnSale,
    });
    
    setSubmitting(false);
    if (error) {
      setAlertConfig(showErrorAlert({
        title: 'Could not post product',
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

  if (loadingShop) {
    return (
      <View style={styles.root}>
        <ThemeStatusBar variant="header" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading shop...</Text>
        </View>
      </View>
    );
  }

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
        >
          {step === 1 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.photoSectionTitle}>Add Product Photos</Text>
                <View style={styles.countChip}>
                  <Ionicons name="image" size={12} color={colors.primary} />
                  <Text style={styles.countChipText}>
                    {photos.length}/{MAX_LISTING_PHOTOS}
                  </Text>
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
                      <Text style={styles.mainPhotoSub}>Showcase your product</Text>
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
                  {Array.from({ length: EXTRA_PHOTO_SLOTS }).map((_, index) => {
                    const photo = extraPhotos[index];
                    const slotIndex = index + 1;
                    const loading = pickingIndex === slotIndex;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.extraBox,
                          {
                            width: PHOTO_LAYOUT.smallSize,
                            height: PHOTO_LAYOUT.smallSize,
                          },
                        ]}
                      >
                        {photo ? (
                          <>
                            <Image source={{ uri: photo.uri }} style={styles.extraPhotoImage} resizeMode="cover" />
                            <Pressable
                              style={styles.removeBadgeSmall}
                              onPress={() => removePhoto(slotIndex)}
                              hitSlop={8}
                            >
                              <Ionicons name="close" size={12} color={colors.onGradient} />
                            </Pressable>
                          </>
                        ) : loading ? (
                          <ActivityIndicator size="small" color={colors.primary} />
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

              {userShop && (
                <View style={styles.shopInfoCard}>
                  <View style={styles.shopInfoRow}>
                    <Ionicons name="storefront" size={20} color={colors.primary} />
                    <Text style={styles.shopInfoText}>Posting to: {userShop.name}</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Product Information</Text>

              <FloatingField
                label="Product Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Product name"
                colors={colors}
                styles={styles}
                inputRef={titleRef}
              />

              <FloatingField
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your product..."
                multiline
                colors={colors}
                styles={styles}
                inputRef={descRef}
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
                placeholder="Selling price"
                keyboardType="numeric"
                colors={colors}
                styles={styles}
                inputRef={priceRef}
              />

              <FloatingField
                label="Original Price (optional)"
                value={originalPrice}
                onChangeText={setOriginalPrice}
                placeholder="Original price for comparison"
                keyboardType="numeric"
                colors={colors}
                styles={styles}
              />

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>On Sale</Text>
                <Switch
                  value={isOnSale}
                  onValueChange={setIsOnSale}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>

              <FloatingField
                label="Stock Quantity"
                value={stock}
                onChangeText={setStock}
                placeholder="Available quantity"
                keyboardType="numeric"
                colors={colors}
                styles={styles}
                inputRef={stockRef}
              />

              <FloatingField
                label="Brand (optional)"
                value={brand}
                onChangeText={setBrand}
                placeholder="Product brand"
                colors={colors}
                styles={styles}
                inputRef={brandRef}
              />

              <FloatingField
                label="SKU/Product Code (optional)"
                value={sku}
                onChangeText={setSku}
                placeholder="Product identifier"
                colors={colors}
                styles={styles}
                inputRef={skuRef}
              />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>Shop Details</Text>

              {userShop && (
                <View style={styles.shopCard}>
                  <View style={styles.shopHeader}>
                    <View style={styles.shopIcon}>
                      <Ionicons name="storefront" size={24} color={colors.onPrimary} />
                    </View>
                    <View style={styles.shopInfo}>
                      <Text style={styles.shopName}>{userShop.name}</Text>
                      <Text style={styles.shopCategory}>{userShop.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.shopLocation}>{userShop.location || 'Location not set'}</Text>
                </View>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.sectionTitle}>Preview & Publish</Text>

              <View style={styles.previewCard}>
                {mainPhoto && (
                  <Image source={{ uri: mainPhoto }} style={styles.previewImage} resizeMode="cover" />
                )}
                <Text style={styles.previewTitle}>{title || 'Product Title'}</Text>
                <Text style={styles.previewPrice}>{previewPrice}</Text>
                {originalPrice && (
                  <Text style={styles.previewOriginalPrice}>
                    Original: Rs {Number(originalPrice).toLocaleString('en-NP')}
                  </Text>
                )}
                <View style={styles.previewMeta}>
                  <View style={styles.previewMetaItem}>
                    <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.previewMetaText}>Stock: {stock}</Text>
                  </View>
                  {brand && (
                    <View style={styles.previewMetaItem}>
                      <Ionicons name="pricetag-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.previewMetaText}>{brand}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.previewCondition}>{condition}</Text>
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
                {step === TOTAL_STEPS ? 'Publish Product' : 'Continue'}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },
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
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.iconBackground,
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
  extraPhotoImage: {
    width: '100%',
    height: '100%',
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
  shopInfoCard: {
    backgroundColor: colors.iconBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  shopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
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
    marginBottom: 16,
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
  shopCard: {
    backgroundColor: colors.iconBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  shopCategory: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  shopLocation: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  previewCard: {
    backgroundColor: colors.iconBackground,
    borderRadius: 16,
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  previewTitle: {
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
  previewOriginalPrice: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLineThrough,
    marginBottom: 4,
  },
  previewMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  previewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  previewCondition: {
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