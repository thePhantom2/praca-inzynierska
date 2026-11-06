import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type ScreenScaffoldProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function ScreenScaffold({ title, subtitle, children }: ScreenScaffoldProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    color: colors.muted,
  },
  body: {
    marginTop: 20,
    gap: 12,
  },
});
