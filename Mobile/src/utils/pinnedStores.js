import AsyncStorage from '@react-native-async-storage/async-storage';

const PINNED_STORES_KEY = '@kinbech_pinned_stores';

export const pinnedStoresUtils = {
  // Get all pinned stores
  getPinnedStores: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(PINNED_STORES_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error reading pinned stores:', e);
      return [];
    }
  },

  // Add a store to pinned
  pinStore: async (store) => {
    try {
      const currentPinned = await pinnedStoresUtils.getPinnedStores();
      const exists = currentPinned.some(s => s._id === store._id);
      
      if (!exists) {
        const updated = [...currentPinned, store];
        await AsyncStorage.setItem(PINNED_STORES_KEY, JSON.stringify(updated));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error pinning store:', e);
      return false;
    }
  },

  // Remove a store from pinned
  unpinStore: async (storeId) => {
    try {
      const currentPinned = await pinnedStoresUtils.getPinnedStores();
      const updated = currentPinned.filter(s => s._id !== storeId);
      await AsyncStorage.setItem(PINNED_STORES_KEY, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('Error unpinning store:', e);
      return false;
    }
  },

  // Check if a store is pinned
  isStorePinned: async (storeId) => {
    try {
      const currentPinned = await pinnedStoresUtils.getPinnedStores();
      return currentPinned.some(s => s._id === storeId);
    } catch (e) {
      console.error('Error checking pinned status:', e);
      return false;
    }
  },

  // Toggle pin status
  togglePin: async (store) => {
    const isPinned = await pinnedStoresUtils.isStorePinned(store._id);
    if (isPinned) {
      return await pinnedStoresUtils.unpinStore(store._id);
    } else {
      return await pinnedStoresUtils.pinStore(store);
    }
  },

  // Clear all pinned stores
  clearAll: async () => {
    try {
      await AsyncStorage.removeItem(PINNED_STORES_KEY);
      return true;
    } catch (e) {
      console.error('Error clearing pinned stores:', e);
      return false;
    }
  },
};

export default pinnedStoresUtils;