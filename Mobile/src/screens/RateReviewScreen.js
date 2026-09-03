import { useState } from 'react';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';
import {
  Text,
  TextInput,
  View,
  Image,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const TAGS = [
  { key: 'communication', label: 'Great communication', icon: 'chatbubble-outline' },
  { key: 'as-described', label: 'Item as described', icon: 'cube-outline' },
  { key: 'fast-deal', label: 'Fast deal', icon: 'flash-outline' },
];

const MAX_LENGTH = 500;

export default function RateReviewScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { seller, listing } = route.params ?? {};
  const [rating, setRating] = useState(4);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  // Guard against undefined colors
  if (!colors) {
    return null;
  }

  const toggleTag = (key) => {
    setSelectedTags((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const handleSubmit = () => {
    // TODO: wire up to review submission API
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.white} />
        </Pressable>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarWrap}>
          <Image source={{ uri: seller?.avatarUrl }} style={styles.avatar} />
        </View>
        <Text style={styles.sellerName}>{seller?.name ?? 'Seller'}</Text>
        <Text style={styles.sellerRole}>Seller</Text>

        <View style={styles.listingCard}>
          <Image source={{ uri: listing?.imageUrl }} style={styles.listingImage} />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={1}>
              {listing?.title}
            </Text>
            <Text style={styles.listingSubtitle}>{listing?.subtitle}</Text>
            <Text style={styles.listingPrice}>
              ₹{Number(listing?.price ?? 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>How would you rate your experience?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable key={value} onPress={() => setRating(value)} hitSlop={6}>
              <Ionicons
                name={value <= rating ? 'star' : 'star-outline'}
                size={40}
                color={value <= rating ? colors.gradientEnd : colors.border}
                style={styles.star}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Tell us more (optional)</Text>
        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Share your experience..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={MAX_LENGTH}
            value={review}
            onChangeText={setReview}
            style={styles.input}
          />
          <Text style={styles.charCount}>
            {review.length}/{MAX_LENGTH}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>What did you like about the experience?</Text>
        <View style={styles.tagsRow}>
          {(TAGS || []).map((tag) => {
            const selected = selectedTags.includes(tag.key);
            return (
              <Pressable
                key={tag.key}
                onPress={() => toggleTag(tag.key)}
                style={[styles.tag, selected && styles.tagSelected]}
              >
                <Ionicons
                  name={tag.icon}
                  size={16}
                  color={colors.gradientStart}
                  style={styles.tagIcon}
                />
                <Text style={styles.tagLabel}>{tag.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={handleSubmit}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitLabel}>Submit Review</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  avatarWrap: {
    marginTop: 8,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
  },
  sellerName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sellerRole: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    marginTop: 20,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listingImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  listingInfo: {
    flex: 1,
    gap: 4,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  listingSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.price,
    marginTop: 2,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  star: {
    marginHorizontal: 2,
  },
  inputWrap: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  input: {
    minHeight: 120,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagSelected: {
    backgroundColor: colors.surfaceSelected ?? colors.surface,
    borderColor: colors.gradientStart,
  },
  tagIcon: {
    marginRight: 6,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.link,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
});
