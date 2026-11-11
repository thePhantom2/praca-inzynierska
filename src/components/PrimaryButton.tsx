import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
};

export function PrimaryButton({ label, onPress, variant = 'primary' }: PrimaryButtonProps) {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isOutline ? styles.outline : isDanger ? styles.danger : styles.primary,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          isOutline ? styles.outlineLabel : isDanger ? styles.dangerLabel : styles.primaryLabel,
        ]}
      >
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
  danger: {
    backgroundColor: colors.danger,
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
  dangerLabel: {
    color: colors.surface,
  },
  outlineLabel: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
});
