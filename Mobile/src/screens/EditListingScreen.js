import { useEffect, useState } from 'react';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';

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

const MAX_PHOTOS = 10;

const CATEGORIES = ['Laptops', 'Mobiles', 'Electronics', 'Furniture', 'Vehicles'];
const CONDITIONS = ['New', 'Good', 'Fair'];

export default function EditListingScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const listingId = route?.params?.listingId;
  const incoming = route?.params?.listing;
  const [photos, setPhotos] = useState([]);
  const [title, setTitle] = useState(incoming?.title || '');
  const [description, setDescription] = useState(incoming?.description || '');
  const [category, setCategory] = useState(incoming?.category || 'Laptops');
  const [condition, setCondition] = useState(incoming?.condition || 'Good');
  const [price, setPrice] = useState(incoming?.price != null ? String(incoming.price) : '');
  const [markSold, setMarkSold] = useState(incoming?.status === 'sold');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listingNotFound, setListingNotFound] = useState(false);

  useEffect(() => {
    if (!listingId) return undefined;
    let active = true;
    (async () => {
      const { data, error } = await api.getListing(listingId);
      if (!active) return;
      setLoading(false);
      if (error || !data?.listing) {
        setListingNotFound(true);
        return;
      }
      const listing = data.listing;
      setTitle(listing.title || '');
      setDescription(listing.description || '');
      setCategory(listing.category || 'Laptops');
      setCondition(listing.condition || 'Good');
      setPrice(listing.price != null ? String(listing.price) : '');
      setMarkSold(listing.status === 'sold');
      setPhotos(
        (listing.photos || [])
          .filter(Boolean)
          .map((uri, index) => ({
            id: String(index),
            uri,
            icon: 'image-outline',
            bg: 'iconBackground',
          }))
      );
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  const save = async () => {
    if (!listingId) {
      navigation.goBack();
      return;
    }
    setSaving(true);
    const { error } = await api.updateListing(listingId, {
      title: title.trim(),
      description: description.trim(),
      category,
      condition,
      price,
      markSold,
      photos: photos.map((photo) => photo.uri).filter(Boolean),
    });
    setSaving(false);
    if (error) {
      Alert.alert('Could not save', error);
      return;
    }
    navigation.goBack();
  };

  // Guard against undefined colors
  if (!colors) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <ThemeStatusBar variant="header" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (listingNotFound) {
    return (
      <View style={styles.root}>
        <ThemeStatusBar variant="header" />
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Text style={[styles.sparkle, { top: 4, left: 8 }]}>✦</Text>
            <Text style={[styles.sparkle, { top: 20, right: 4, fontSize: 10 }]}>✦</Text>
            <Ionicons name="cube-outline" size={64} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Listing Not Found</Text>
          <Text style={styles.emptySubtitle}>This listing may have been removed or is no longer available</Text>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Resolve photo colors dynamically
  const getPhotoColor = (bg) => resolveColor(`colors.${bg}`, colors);
  const resolvedPhotos = (photos || []).map(photo => ({
    ...photo,
    bg: getPhotoColor(photo.bg)
  }));

  const removePhoto = (id) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  const addPhoto = () => {
    if (photos.length >= MAX_PHOTOS) return;
    setPhotos((prev) => [
      ...prev,
      { id: String(Date.now()), icon: 'image-outline', bg: 'pastelLime' },
    ]);
  };

  const cycleValue = (list, current, setter) => {
    const index = list.indexOf(current);
    setter(list[(index + 1) % list.length]);
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
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.onGradient} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Listing</Text>
        <Pressable
          hitSlop={10}
          style={styles.saveBtn}
          onPress={save}
          disabled={saving}
        >
          <Ionicons name="checkmark" size={22} color={colors.primary} />
        </Pressable>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.photoCount}>{photos.length}/{MAX_PHOTOS} photos</Text>
        </View>

        <View style={styles.photoGrid}>
          {(resolvedPhotos || []).map((photo) => (
            <View key={photo.id} style={styles.photoBox}>
              <View style={[styles.photoThumb, { backgroundColor: photo.bg }]}>
                {photo.uri ? (
                  <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <Ionicons name={photo.icon} size={30} color={colors.primary} />
                )}
              </View>
              <Pressable
                style={styles.removeBtn}
                hitSlop={8}
                onPress={() => removePhoto(photo.id)}
              >
                <Ionicons name="close" size={14} color={colors.text} />
              </Pressable>
            </View>
          ))}

          {photos.length < MAX_PHOTOS && (
            <Pressable style={styles.addMoreBox} onPress={addPhoto}>
              <View style={styles.addMoreCircle}>
                <Ionicons name="add" size={20} color={colors.onGradient} />
              </View>
              <Text style={styles.addMoreText}>Add More</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, styles.textarea]}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={styles.label}>Category</Text>
            <Pressable
              style={styles.selectInput}
              onPress={() => cycleValue(CATEGORIES, category, setCategory)}
            >
              <Ionicons name="laptop-outline" size={18} color={colors.textMuted} />
              <Text style={styles.selectText}>{category}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={[styles.field, styles.half]}>
            <Text style={styles.label}>Condition</Text>
            <Pressable
              style={styles.selectInput}
              onPress={() => cycleValue(CONDITIONS, condition, setCondition)}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />
              <Text style={styles.selectText}>{condition}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Price</Text>
          <View style={styles.priceInput}>
            <Text style={styles.priceSymbol}>₹</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={styles.priceText}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.soldRow}>
          <View style={styles.soldTextWrap}>
            <Text style={styles.soldTitle}>Mark as Sold</Text>
            <Text style={styles.soldSubtitle}>
              This listing will be marked as sold and hidden from others.
            </Text>
          </View>
          <Switch
            value={markSold}
            onValueChange={setMarkSold}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>

        <Pressable onPress={() => navigation.goBack()}>
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.updateButton}
          >
            <Text style={styles.updateText}>Update Listing</Text>
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.deleteBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.deleteText}>Delete Listing</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: colors.onPrimary,
    marginLeft: 4,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  photoCount: {
    fontSize: 13,
    color: colors.textMuted,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  photoBox: {
    width: '22.5%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'visible',
  },
  photoThumb: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addMoreBox: {
    width: '22.5%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  addMoreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  priceSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 6,
  },
  priceText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 14,
  },
  soldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  soldTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  soldTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  soldSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  updateButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  updateText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  deleteBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 13,
    color: colors.primary,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.link,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.link,
  },
});
