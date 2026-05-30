import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

type LogoPickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
};

export function LogoPickerField({
  label,
  value,
  onChange,
  helperText,
}: LogoPickerFieldProps) {
  const [busy, setBusy] = useState(false);

  const pickLogo = async () => {
    setBusy(true);

    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert("Permission needed", "Allow photo access to choose a logo.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType || "image/jpeg";
      const nextValue = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : asset.uri;

      onChange(nextValue);
    } catch (error) {
      Alert.alert(
        "Logo upload failed",
        error instanceof Error ? error.message : "We could not choose that image.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.previewCard}>
        {value ? (
          <Image source={{ uri: value }} style={styles.logoPreview} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>No logo selected</Text>
            <Text style={styles.placeholderText}>PNG or JPG from your gallery</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={pickLogo}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : undefined,
          ]}
        >
          <Text style={styles.primaryButtonText}>{busy ? "Opening..." : "Upload logo"}</Text>
        </Pressable>

        {value ? (
          <Pressable
            onPress={() => onChange("")}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.pressed : undefined,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  label: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
  previewCard: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#d8e1ea",
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 146,
    overflow: "hidden",
    padding: 16,
  },
  logoPreview: {
    height: 112,
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    gap: 6,
  },
  placeholderTitle: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700",
  },
  placeholderText: {
    color: "#64748b",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 14,
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d8e1ea",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.88,
  },
});
