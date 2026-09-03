import { Text, View } from 'react-native';
import { useThemedStyles } from '../theme';

const createStyles = (colors) => ({
  row: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rowMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mine: {
    backgroundColor: colors.chatMine,
    borderBottomRightRadius: 4,
  },
  theirs: {
    backgroundColor: colors.chatTheirs,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    color: colors.text,
  },
  mineText: {
    color: colors.onPrimary,
  },
});

export default function ChatBubble({ message, isMine = false }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
        <Text style={[styles.text, isMine && styles.mineText]}>{message}</Text>
      </View>
    </View>
  );
}
