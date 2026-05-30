import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { SlipPreviewPaper } from "@/components/slip-preview-paper";
import { SlipPreviewReceipt } from "@/components/slip-preview-receipt";
import {
  buildSlipFileName,
  buildSlipHtml,
  buildWordFileName,
  buildWordHtml,
  getReceiptSummaryRows,
  getSlipSummaryRows,
  parseSlipData,
  slipSizeOptions,
  toSlipData,
  type SlipFormValues,
} from "@/lib/slip";
import {
  printSlipPdfAsync,
  saveSlipPdfAsync,
  saveWordDocumentAsync,
  shareSlipPdfAsync,
} from "@/lib/pdf";
import { getSlipDraft } from "@/lib/slip-draft-store";

type RouteParams = {
  draftId?: string | string[];
  payload?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? "";
}

export default function PreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const [busyAction, setBusyAction] = useState<
    "download-pdf" | "download-word" | "share-pdf" | "print" | null
  >(null);

  const draftId = firstValue(params.draftId);
  const payload = firstValue(params.payload);

  const parsedData = useMemo(() => {
    if (draftId) {
      const draft = getSlipDraft(draftId);
      return draft ? parseSlipData(draft) : null;
    }

    if (!payload) {
      return null;
    }

    try {
      const raw = JSON.parse(decodeURIComponent(payload)) as SlipFormValues;
      return parseSlipData(raw);
    } catch {
      return null;
    }
  }, [draftId, payload]);

  useEffect(() => {
    if ((!draftId && !payload) || !parsedData || !parsedData.success) {
      Alert.alert("Missing slip data", "Please create the invoice again from the home screen.");
      router.replace("/");
    }
  }, [draftId, parsedData, payload, router]);

  if (!parsedData || !parsedData.success) {
    return null;
  }

  const data = toSlipData(parsedData.data as SlipFormValues);
  const html = buildSlipHtml(data);
  const wordHtml = buildWordHtml(data);
  const fileName = buildSlipFileName(data);
  const wordFileName = buildWordFileName(data);
  const summaryRows =
    data.slipSize === "receipt-80mm" ? getReceiptSummaryRows(data) : getSlipSummaryRows(data);
  const slipSizeLabel =
    slipSizeOptions.find((option) => option.value === data.slipSize)?.label ?? "Slip";
  const exportLayout = {
    slipSize: data.slipSize,
    itemCount: data.items.length,
  };

  const runAction = async (
    action: "download-pdf" | "download-word" | "share-pdf" | "print",
    task: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setBusyAction(action);
    try {
      const result = await task();
      Alert.alert("Ready", typeof result === "string" ? `${successMessage}\n${result}` : successMessage);
    } catch (error) {
      Alert.alert(
        "Action failed",
        error instanceof Error ? error.message : "We could not complete that action.",
      );
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Preview slip design</Text>
        <Text style={styles.headerText}>
          {slipSizeLabel} preview. This design matches the PDF and Word files generated from this
          screen.
        </Text>
      </View>

      {data.slipSize === "receipt-80mm" ? (
        <SlipPreviewReceipt data={data} />
      ) : (
        <SlipPreviewPaper data={data} />
      )}

      <View style={styles.totalCard}>
        {summaryRows.map((row) => (
          <View key={row.label} style={styles.totalRow}>
            <Text style={[styles.totalLabel, row.emphasis ? styles.totalLabelStrong : undefined]}>
              {row.label}
            </Text>
            <Text style={[styles.totalValue, row.emphasis ? styles.totalValueStrong : undefined]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actionPanel}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.primaryButton,
            pressed ? styles.pressed : undefined,
          ]}
          disabled={busyAction !== null}
          onPress={() =>
            runAction(
              "download-pdf",
              () => saveSlipPdfAsync(html, fileName, exportLayout),
              "The PDF file was saved successfully.",
            )
          }
        >
          <Text style={styles.primaryButtonText}>
            {busyAction === "download-pdf" ? "Saving..." : "Download PDF file"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.secondaryButton,
            pressed ? styles.pressed : undefined,
          ]}
          disabled={busyAction !== null}
          onPress={() =>
            runAction(
              "download-word",
              () => saveWordDocumentAsync(wordHtml, wordFileName),
              "The Word file was saved successfully.",
            )
          }
        >
          <Text style={styles.secondaryButtonText}>
            {busyAction === "download-word" ? "Saving..." : "Download Word file"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.secondaryButton,
            pressed ? styles.pressed : undefined,
          ]}
          disabled={busyAction !== null}
          onPress={() =>
            runAction(
              "share-pdf",
              () => shareSlipPdfAsync(html, fileName, exportLayout),
              "The share sheet is ready.",
            )
          }
        >
          <Text style={styles.secondaryButtonText}>
            {busyAction === "share-pdf" ? "Sharing..." : "Share PDF"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.ghostButton,
            pressed ? styles.pressed : undefined,
          ]}
          disabled={busyAction !== null}
          onPress={() =>
            runAction(
              "print",
              () => printSlipPdfAsync(html, fileName, exportLayout),
              "The print action opened successfully.",
            )
          }
        >
          <Text style={styles.ghostButtonText}>
            {busyAction === "print" ? "Opening..." : "Print slip"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>PDF file name</Text>
        <Text style={styles.noteValue}>{fileName}</Text>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Word file name</Text>
        <Text style={styles.noteValue}>{wordFileName}</Text>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Download behavior</Text>
        <Text style={styles.noteValue}>
          On Android, the app asks you to choose a folder so the PDF or Word file is saved in a
          real device location. On iPhone, it saves in the app folder and you can export the
          file with Share. Word files open in apps like Microsoft Word or WPS Office.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 32,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ee",
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  headerTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
  },
  headerText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
  },
  totalCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ee",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  totalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  totalLabelStrong: {
    color: "#111827",
    fontWeight: "800",
  },
  totalValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  totalValueStrong: {
    fontSize: 16,
  },
  actionPanel: {
    gap: 12,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ee",
    borderWidth: 1,
  },
  ghostButton: {
    backgroundColor: "#e5e7eb",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  ghostButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  noteCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ee",
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  noteTitle: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  noteValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
