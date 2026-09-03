import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../navigation/helpers';
import { api } from '../services/api';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

export default function ChatListScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [chats, setChats] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const { data, error } = await api.getChats();
        if (!active) return;
        if (error) {
          console.error('Failed to load chats:', error);
          setChats([]);
        } else {
          setChats(data?.chats || []);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemeStatusBar />
      <Text style={styles.title}>Chats</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {chats.length === 0 ? (
          <Text style={styles.preview}>No conversations yet. Chat a seller from an item page.</Text>
        ) : null}
        {chats.map((chat) => (
          <Pressable
            key={chat.id}
            style={styles.row}
            onPress={() =>
              navigation.navigate(ROUTES.CHAT, {
                chatId: chat.id,
                name: chat.otherUser?.name || 'Seller',
                listing: chat.listing,
              })
            }
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={22} color={colors.primary} />
            </View>
            <View style={styles.body}>
              <View style={styles.topRow}>
                <Text style={styles.name}>{chat.otherUser?.name || 'Seller'}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {chat.lastMessage || 'Start the conversation'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  preview: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
});

