import { Pressable, StyleSheet, Text, View } from "react-native";
import { Controller, type Control } from "react-hook-form";

import { FormField } from "@/components/form-field";
import type { SlipFormValues } from "@/lib/slip";

type ItemEditorCardProps = {
  control: Control<SlipFormValues>;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  lineTotal: string;
};

export function ItemEditorCard({
  control,
  index,
  canRemove,
  onRemove,
  lineTotal,
}: ItemEditorCardProps) {
  const baseName = `items.${index}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Item {index + 1}</Text>
          <Text style={styles.subtitle}>Add the item details for this slip line.</Text>
        </View>

        {canRemove ? (
          <Pressable onPress={onRemove} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.fields}>
        <Controller
          control={control}
          name={`${baseName}.itemName`}
          render={({ field, fieldState }) => (
            <FormField
              label="Item name"
              placeholder="Packing label"
              autoCapitalize="words"
              value={String(field.value ?? "")}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <View style={styles.row}>
          <View style={styles.halfColumn}>
            <Controller
              control={control}
              name={`${baseName}.quantity`}
              render={({ field, fieldState }) => (
                <FormField
                  label="Quantity"
                  placeholder="1"
                  keyboardType="number-pad"
                  value={String(field.value ?? "")}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>

          <View style={styles.halfColumn}>
            <Controller
              control={control}
              name={`${baseName}.unitPrice`}
              render={({ field, fieldState }) => (
                <FormField
                  label="Unit price"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={String(field.value ?? "")}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfColumn}>
            <Controller
              control={control}
              name={`${baseName}.discountPercent`}
              render={({ field, fieldState }) => (
                <FormField
                  label="Discount %"
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={String(field.value ?? "")}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>

          <View style={styles.halfColumn}>
            <Controller
              control={control}
              name={`${baseName}.taxPercent`}
              render={({ field, fieldState }) => (
                <FormField
                  label="Tax %"
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={String(field.value ?? "")}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Line total</Text>
        <Text style={styles.footerValue}>{lineTotal}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8fafc",
    borderColor: "#dbe4ee",
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  header: {
    alignItems: "flex-start",
    gap: 12,
    justifyContent: "space-between",
  },
  headerCopy: {
    gap: 4,
  },
  title: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
  },
  removeButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  removeButtonText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "800",
  },
  fields: {
    gap: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  footer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
  footerValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },
});
