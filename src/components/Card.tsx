import { Pressable, StyleSheet, Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/ThemeProvider';

type CardProps = {
  title: string;
  description: string;
  onPress?: () => void;
};

export function Card({ title, description, onPress }: CardProps) {
  const styles = useStyles();
  const content = (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.7,
  },
}));
