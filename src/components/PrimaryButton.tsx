import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
};

export function PrimaryButton({ label, onPress, variant = 'primary' }: PrimaryButtonProps) {
  const isOutline = variant === 'outline';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isOutline ? styles.outline : styles.primary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, isOutline ? styles.outlineLabel : styles.primaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryLabel: {
    color: colors.surface,
  },
  outlineLabel: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
});
