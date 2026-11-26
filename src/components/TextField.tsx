import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme, createThemedStyles } from '@/theme/ThemeProvider';

type TextFieldProps = TextInputProps & {
  label: string;
};

export function TextField({ label, ...inputProps }: TextFieldProps) {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardAppearance={isDark ? 'dark' : 'light'}
        selectionColor={colors.primary}
        placeholderTextColor={colors.tabInactive}
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
        style={[styles.input, inputProps.style]}
      />
    </View>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
}));
