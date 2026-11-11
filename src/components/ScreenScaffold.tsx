import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

type ScreenScaffoldProps = {
  title: string;
  subtitle?: string;
  subtitleStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
  topInset?: boolean;
};

export function ScreenScaffold({ title, subtitle, subtitleStyle, children, topInset = true }: ScreenScaffoldProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: (topInset ? insets.top : 0) + 16,
          paddingBottom: insets.bottom + 32,
        },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scroll}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text> : null}
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
    paddingHorizontal: 20,
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
