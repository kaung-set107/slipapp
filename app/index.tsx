import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FormField } from "@/components/form-field";
import { ItemEditorCard } from "@/components/item-editor-card";
import { LogoPickerField } from "@/components/logo-picker-field";
import { SlipSizeSelector } from "@/components/slip-size-selector";
import { MoneyCard } from "@/components/slip-summary-card";
import {
  calculateBalance,
  calculateLiveTotals,
  coerceNumber,
  createEmptyItem,
  createInitialSlipForm,
  formatMoney,
  normalizeSlipItem,
  slipSchema,
  type SlipFormValues,
} from "@/lib/slip";
import { saveSlipDraft } from "@/lib/slip-draft-store";

type ActiveSection = "header" | "slip" | null;

export default function HomeScreen() {
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  const { control, formState, handleSubmit, watch } = useForm<SlipFormValues>({
    defaultValues: createInitialSlipForm(),
    resolver: zodResolver(slipSchema),
  });

  const { fields, append, remove } = useFieldArray<
    SlipFormValues,
    SlipFormValues["items"][number]
  >({
    control,
    name: "items",
  });

  const watchedValues = watch();
  const totals = useMemo(
    () => calculateLiveTotals(watchedValues),
    [watchedValues],
  );
  const cashReceived = coerceNumber(watchedValues.cashReceived);
  const balance = calculateBalance(cashReceived, totals.grandTotal);
  const liveItemTotals = useMemo(
    () => watchedValues.items.map((item) => normalizeSlipItem(item)),
    [watchedValues.items],
  );

  const onSubmit = handleSubmit(async (values) => {
    const draftId = saveSlipDraft(values);

    router.push({
      pathname: "/preview",
      params: {
        draftId,
      },
    } as never);
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Slip Studio</Text>
          </View>
          <Text style={styles.title}>
            Choose a category card to open its section.
          </Text>

          <Text style={styles.heroMeta}>
            {watchedValues.businessTitle}
            {watchedValues.businessSubtitle
              ? ` | ${watchedValues.businessSubtitle}`
              : ""}
          </Text>
        </View>

        <View style={styles.categoryGrid}>
          <CategoryCard
            active={activeSection === "header"}
            eyebrow="Card 1"
            onPress={() => setActiveSection("header")}
            text="Upload logo and set business title, address, and phone."
            title="Slip Header"
          />
          <CategoryCard
            active={activeSection === "slip"}
            eyebrow="Card 2"
            onPress={() => setActiveSection("slip")}
            text="Choose slip size, customer details, invoice info, items, and totals."
            title="Slip Create"
          />
        </View>

        {activeSection === null ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              Choose a card to continue
            </Text>
            <Text style={styles.emptyStateText}>
              Tap `Card 1` for the header section or `Card 2` for the slip
              creation section.
            </Text>
          </View>
        ) : null}

        {activeSection === "header" ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardEyebrow}>Card 1</Text>
                <Text style={styles.cardTitle}>Slip Header</Text>
              </View>
              <View style={styles.cardPill}>
                <Text style={styles.cardPillText}>Logo + business info</Text>
              </View>
            </View>

            <View style={styles.fields}>
              <Controller
                control={control}
                name="businessLogo"
                render={({ field }) => (
                  <LogoPickerField
                    label="Business logo"
                    value={String(field.value ?? "")}
                    onChange={field.onChange}
                    helperText="The selected logo appears in preview, PDF, and Word exports."
                  />
                )}
              />

              <Controller
                control={control}
                name="businessTitle"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Business title"
                    placeholder="Your Store Name"
                    autoCapitalize="words"
                    value={String(field.value ?? "")}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="businessSubtitle"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Business subtitle"
                    placeholder="Distribution"
                    autoCapitalize="words"
                    value={String(field.value ?? "")}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="businessAddress"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Business address"
                    placeholder="No. 12, Main Road, Yangon"
                    autoCapitalize="words"
                    multiline
                    style={styles.multilineInput}
                    value={String(field.value ?? "")}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="businessPhone"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Business phone"
                    placeholder="09-962 229 996, 09-961 010 865"
                    value={String(field.value ?? "")}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>
          </View>
        ) : null}

        {activeSection === "slip" ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardEyebrow}>Card 2</Text>
                <Text style={styles.cardTitle}>Slip Create</Text>
              </View>
              <View style={styles.cardPill}>
                <Text style={styles.cardPillText}>
                  {watchedValues.items.length} item(s)
                </Text>
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Slip size</Text>
              <Controller
                control={control}
                name="slipSize"
                render={({ field }) => (
                  <SlipSizeSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Invoice details</Text>
              <View style={styles.fields}>
                <View style={styles.row}>
                  <View style={styles.halfColumn}>
                    <Controller
                      control={control}
                      name="invoiceNo"
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Invoice no"
                          placeholder="INV-001"
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
                      name="invoiceDate"
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Date"
                          placeholder="2026-05-30"
                          value={String(field.value ?? "")}
                          onChangeText={field.onChange}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </View>
                </View>

                <Controller
                  control={control}
                  name="salePerson"
                  render={({ field, fieldState }) => (
                    <FormField
                      label="Sale person"
                      placeholder="Aung Min"
                      autoCapitalize="words"
                      value={String(field.value ?? "")}
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Customer details</Text>
              <View style={styles.fields}>
                <Controller
                  control={control}
                  name="customerName"
                  render={({ field, fieldState }) => (
                    <FormField
                      label="Customer name"
                      placeholder="Jane Cooper"
                      autoCapitalize="words"
                      value={String(field.value ?? "")}
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="customerAddress"
                  render={({ field, fieldState }) => (
                    <FormField
                      label="Address"
                      placeholder="No. 12, Main Road, Yangon"
                      autoCapitalize="words"
                      multiline
                      style={styles.multilineInput}
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
                      name="cashReceived"
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Cash receive"
                          placeholder="0.00"
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
                      name="remark"
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Remark"
                          placeholder="Paid in cash"
                          value={String(field.value ?? "")}
                          onChangeText={field.onChange}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Items</Text>
                <Pressable
                  onPress={() => append(createEmptyItem())}
                  style={({ pressed }) => [
                    styles.addButton,
                    pressed ? styles.addButtonPressed : undefined,
                  ]}
                >
                  <Text style={styles.addButtonText}>Add item</Text>
                </Pressable>
              </View>

              <View style={styles.fields}>
                {fields.map((field, index) => (
                  <ItemEditorCard
                    key={field.id}
                    control={control}
                    index={index}
                    canRemove={fields.length > 1}
                    onRemove={() => remove(index)}
                    lineTotal={formatMoney(
                      liveItemTotals[index]?.grandTotal ?? 0,
                    )}
                  />
                ))}
              </View>
            </View>

            <MoneyCard
              subtotal={totals.subtotal}
              discountAmount={totals.discountAmount}
              taxAmount={totals.taxAmount}
              grandTotal={totals.grandTotal}
              cashReceived={cashReceived}
              balance={balance}
            />

            <View style={styles.footer}>
              <Pressable
                onPress={onSubmit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed ? styles.primaryButtonPressed : undefined,
                ]}
              >
                <Text style={styles.primaryButtonText}>Preview slip</Text>
              </Pressable>

              {Object.keys(formState.errors).length > 0 ? (
                <Text style={styles.footerError}>
                  Fix the highlighted fields before continuing.
                </Text>
              ) : (
                <Text style={styles.footerNote}>
                  Preview will use your logo and business header, then let you
                  download PDF or Word.
                </Text>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type CategoryCardProps = {
  active: boolean;
  eyebrow: string;
  onPress: () => void;
  text: string;
  title: string;
};

function CategoryCard({
  active,
  eyebrow,
  onPress,
  text,
  title,
}: CategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryCard,
        active ? styles.categoryCardActive : undefined,
        pressed ? styles.categoryCardPressed : undefined,
      ]}
    >
      <Text style={styles.categoryEyebrow}>{eyebrow}</Text>
      <Text style={styles.categoryTitle}>{title}</Text>
      <Text style={styles.categoryText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef2f7",
  },
  scrollContent: {
    gap: 18,
    paddingBottom: 32,
    paddingHorizontal: 18,
    paddingTop: 54,
  },
  hero: {
    backgroundColor: "#152238",
    borderRadius: 28,
    gap: 14,
    overflow: "hidden",
    padding:18,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#f9fafb",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  subtitle: {
    color: "#d1d5db",
    fontSize: 15,
    lineHeight: 22,
  },
  heroMeta: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  categoryGrid: {
    gap: 14,
  },
  categoryCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ee",
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  categoryCardActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  categoryCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  categoryEyebrow: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  categoryTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
  },
  categoryText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyStateCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ee",
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  emptyStateTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyStateText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ee",
    borderRadius: 28,
    borderWidth: 1,
    gap: 20,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardEyebrow: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  cardPill: {
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardPillText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionBlock: {
    gap: 14,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 18,
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
  multilineInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  addButton: {
    backgroundColor: "#dbeafe",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "800",
  },
  footer: {
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 18,
    paddingVertical: 16,
  },
  primaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  footerNote: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
  },
  footerError: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
