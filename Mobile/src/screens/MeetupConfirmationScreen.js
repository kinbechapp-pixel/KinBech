import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { ROUTES } from '../navigation/helpers';
import { useThemedStyles, ThemeStatusBar } from '../theme';

const createStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
  },
});

export default function MeetupConfirmationScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemeStatusBar />
      <Text style={styles.title}>Meetup confirmed</Text>
      <Text style={styles.body}>Meet in a public place and keep the chat in the app for safety.</Text>
      <Button
        title="Rate Seller"
        onPress={() =>
          navigation.navigate(ROUTES.RATE_REVIEW, {
            seller: { name: 'Suman Shrestha' },
            listing: { title: 'iPhone 13 128GB', subtitle: '128GB • Good condition', price: 34500 },
          })
        }
      />
      <Button title="Done" variant="outline" onPress={() => navigation.goBack()} />
    </SafeAreaView>
  );
}
