import { Pressable, StyleSheet, Text, View } from "react-native";

import { slipSizeOptions, type SlipSize } from "@/lib/slip";

type SlipSizeSelectorProps = {
  value: SlipSize;
  onChange: (value: SlipSize) => void;
};

export function SlipSizeSelector({ value, onChange }: SlipSizeSelectorProps) {
  return (
    <View style={styles.wrapper}>
      {slipSizeOptions.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              active ? styles.optionActive : undefined,
              pressed ? styles.optionPressed : undefined,
            ]}
          >
            <Text style={[styles.label, active ? styles.labelActive : undefined]}>
              {option.label}
            </Text>
            <Text style={[styles.description, active ? styles.descriptionActive : undefined]}>
              {option.description}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  option: {
    backgroundColor: "#f8fafc",
    borderColor: "#dbe4ee",
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  optionPressed: {
    opacity: 0.9,
  },
  label: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  labelActive: {
    color: "#1d4ed8",
  },
  description: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
  },
  descriptionActive: {
    color: "#475569",
  },
});
