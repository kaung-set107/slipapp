import { Text, TextInput, TextInputProps, View, StyleSheet } from "react-native";

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
  helperText?: string;
};

export function FormField({ label, error, helperText, style, ...props }: FormFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        style={[styles.input, error ? styles.inputError : undefined, style]}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {helperText && !error ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#d8e1ea",
    borderRadius: 16,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
  },
});
