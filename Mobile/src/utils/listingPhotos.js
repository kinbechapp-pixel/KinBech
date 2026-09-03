import { Alert } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export const MAX_LISTING_PHOTOS = 4;
export const EXTRA_PHOTO_SLOTS = 3;
export const MAX_LISTING_VIDEOS = 1;

const SPECS = {
  main: { aspect: [1, 1], width: 800 },
  extra: { aspect: [1, 1], width: 720 },
};

async function ensurePermission(kind = 'photo') {
  if (kind === 'video') {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (lib.status !== 'granted') {
      Alert.alert('Media permission', 'Allow media access to upload video.');
      return false;
    }
    return true;
  }
  const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (library.status !== 'granted') {
    Alert.alert('Photos permission', 'Allow photo access to upload listing images.');
    return false;
  }
  return true;
}

async function normalizePhoto(uri, spec) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: spec.width } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export async function pickListingPhoto(slotType = 'main') {
  const allowed = await ensurePermission('photo');
  if (!allowed) {
    return null;
  }

  const spec = SPECS[slotType] || SPECS.extra;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: spec.aspect,
    quality: 1,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  return normalizePhoto(result.assets[0].uri, spec);
}

export async function pickListingVideo() {
  const allowed = await ensurePermission('video');
  if (!allowed) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: true,
    quality: 0,
    videoMaxDuration: 60,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    duration: asset.duration || 0,
    type: 'video',
  };
}
