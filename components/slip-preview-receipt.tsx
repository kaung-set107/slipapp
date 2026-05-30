import { Image, StyleSheet, Text, View } from "react-native";

import {
  getReceiptRows,
  getReceiptSummaryRows,
  type SlipData,
} from "@/lib/slip";

type SlipPreviewReceiptProps = {
  data: SlipData;
};

export function SlipPreviewReceipt({ data }: SlipPreviewReceiptProps) {
  const rows = getReceiptRows(data);
  const summaryRows = getReceiptSummaryRows(data);

  return (
    <View style={styles.wrapper}>
      <View style={styles.receipt}>
        <View style={styles.header}>
          {data.businessLogo ? (
            <Image source={{ uri: data.businessLogo }} style={styles.logo} resizeMode="contain" />
          ) : null}
          <Text style={styles.shopName}>{data.businessTitle}</Text>
          {data.businessSubtitle ? <Text style={styles.metaLine}>{data.businessSubtitle}</Text> : null}
          <Text style={styles.metaLine}>{data.businessAddress}</Text>
          <Text style={styles.metaLine}>{data.businessPhone}</Text>
        </View>

        <Text style={styles.separator}>===========================</Text>
        <Text style={styles.centerText}>Receipt No {data.invoiceNo}</Text>
        <Text style={styles.centerText}>Date: {data.invoiceDate}</Text>
        <Text style={styles.separator}>===========================</Text>

        <View style={styles.items}>
          {rows.map((row) => (
            <View key={`${row.no}-${row.name}`} style={styles.itemRow}>
              <Text style={styles.itemLabel}>
                {row.no} {row.name}
              </Text>
              <Text style={styles.itemAmount}>{row.amount}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.separator}>---------------------------</Text>

        <View style={styles.summary}>
          {summaryRows.map((row) => (
            <View key={row.label} style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, row.emphasis ? styles.strong : undefined]}>
                {row.label}
              </Text>
              <Text style={[styles.summaryValue, row.emphasis ? styles.strong : undefined]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.separator}>===========================</Text>
        <Text style={styles.footerMessage}>Thank you for purchase !</Text>
        {data.remark ? <Text style={styles.remark}>{data.remark}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  receipt: {
    backgroundColor: "#fffefc",
    borderColor: "#ddd6ce",
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 320,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 5,
    width: "100%",
  },
  header: {
    alignItems: "center",
    gap: 2,
  },
  logo: {
    height: 50,
    marginBottom: 8,
    width: 100,
  },
  shopName: {
    color: "#202020",
    fontFamily: "monospace",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  metaLine: {
    color: "#202020",
    fontFamily: "monospace",
    fontSize: 14,
    textAlign: "center",
  },
  separator: {
    color: "#202020",
    fontFamily: "monospace",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  centerText: {
    color: "#202020",
    fontFamily: "monospace",
    fontSize: 16,
    marginTop: 4,
    textAlign: "center",
  },
  items: {
    gap: 6,
    marginTop: 12,
  },
  itemRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  itemLabel: {
    color: "#202020",
    flex: 1,
    fontFamily: "monospace",
    fontSize: 16,
  },
  itemAmount: {
    color: "#202020",
    fontFamily: "monospace",
    fontSize: 16,
    textAlign: "right",
  },
  summary: {
    gap: 4,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: "#202020",
    fontFamily: "monospace",
    fontSize: 16,
  },
  summaryValue: {
    color: "#202020",
    fontFamily: "monospace",
    fontSize: 16,
    textAlign: "right",
  },
  strong: {
    fontWeight: "800",
  },
  footerMessage: {
    color: "#202020",
    fontFamily: "monospace",
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
  },
  remark: {
    color: "#4b5563",
    fontFamily: "monospace",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
});
