import { Image, StyleSheet, Text, View } from "react-native";

import {
  formatMoney,
  getInvoiceTableRows,
  getSlipSummaryRows,
  type SlipData,
} from "@/lib/slip";

type SlipPreviewPaperProps = {
  data: SlipData;
};

export function SlipPreviewPaper({ data }: SlipPreviewPaperProps) {
  const rows = getInvoiceTableRows(data, 6);
  const summaryRows = getSlipSummaryRows(data);

  return (
    <View style={styles.paper}>
      <View style={styles.header}>
        {data.businessLogo ? (
          <Image source={{ uri: data.businessLogo }} style={styles.logo} resizeMode="contain" />
        ) : null}
        <Text style={styles.companyName}>{data.businessTitle}</Text>
        {data.businessSubtitle ? (
          <Text style={styles.companySubtitle}>{data.businessSubtitle}</Text>
        ) : null}
        <Text style={styles.companyMeta}>{data.businessAddress}</Text>
        <Text style={styles.companyMeta}>{data.businessPhone}</Text>
      </View>

      <View style={styles.rule} />

      <View style={styles.topRow}>
        <Text style={styles.topLabel}>Sale Invoice</Text>
        <Text style={styles.topLabel}>Date: {data.invoiceDate}</Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <InfoCell label="Customer" value={data.customerName} />
          <InfoCell label="Invoice No" value={data.invoiceNo} />
        </View>
        <View style={styles.infoRow}>
          <InfoCell label="Address" value={data.customerAddress || "-"} />
          <InfoCell label="Sale Person" value={data.salePerson || "-"} />
        </View>
        <View style={styles.infoRow}>
          <InfoCell label="Invoice Date" value={data.invoiceDate} />
          <InfoCell label="" value="" />
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.headerRow}>
          <HeaderCell label="No." width={0.08} />
          <HeaderCell label="Item name" width={0.38} />
          <HeaderCell label="Qty" width={0.09} />
          <HeaderCell label="Price" width={0.14} />
          <HeaderCell label="Discount" width={0.15} />
          <HeaderCell label="Amount" width={0.16} />
        </View>

        {rows.map((row, index) => (
          <View key={`${row.no}-${index}`} style={styles.bodyRow}>
            <BodyCell value={row.no} width={0.08} align="center" />
            <BodyCell value={row.itemName} width={0.38} />
            <BodyCell value={row.qty} width={0.09} align="center" />
            <BodyCell value={row.price} width={0.14} align="right" />
            <BodyCell value={row.discount} width={0.15} align="center" />
            <BodyCell value={row.amount} width={0.16} align="right" />
          </View>
        ))}
      </View>

      <View style={styles.summaryWrap}>
        {summaryRows.map((row) => (
          <View key={row.label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{row.label}</Text>
            <Text style={[styles.summaryValue, row.emphasis ? styles.summaryValueStrong : undefined]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.remarkRow}>
        <Text style={styles.remarkLabel}>Remark</Text>
        <View style={styles.remarkLine} />
        <Text style={styles.remarkText}>{data.remark}</Text>
      </View>

      <View style={styles.footerMeta}>
        <Text style={styles.footerMetaText}>
          Total items: {data.totals.itemCount} | Gross: {formatMoney(data.totals.subtotal)}
        </Text>
      </View>
    </View>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  if (!label && !value) {
    return <View style={styles.infoCell} />;
  }

  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>: {value}</Text>
    </View>
  );
}

function HeaderCell({ label, width }: { label: string; width: number }) {
  return (
    <View style={[styles.headerCell, { width: `${width * 100}%` }]}>
      <Text style={styles.headerCellText}>{label}</Text>
    </View>
  );
}

function BodyCell({
  value,
  width,
  align = "left",
}: {
  value: string;
  width: number;
  align?: "left" | "center" | "right";
}) {
  return (
    <View style={[styles.bodyCell, { width: `${width * 100}%` }]}>
      <Text
        style={[
          styles.bodyCellText,
          align === "center" ? styles.textCenter : undefined,
          align === "right" ? styles.textRight : undefined,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: "#fffef9",
    borderColor: "#d4d4d4",
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  logo: {
    height: 52,
    marginBottom: 6,
    width: 120,
  },
  companyName: {
    color: "#111827",
    fontFamily: "serif",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  companySubtitle: {
    color: "#111827",
    fontFamily: "serif",
    fontSize: 16,
    fontWeight: "700",
  },
  companyMeta: {
    color: "#111827",
    fontFamily: "serif",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  rule: {
    borderStyle: "dashed",
    borderTopColor: "#111827",
    borderTopWidth: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topLabel: {
    color: "#111827",
    fontFamily: "serif",
    fontSize: 16,
    fontWeight: "700",
  },
  infoGrid: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    gap: 14,
  },
  infoCell: {
    flex: 1,
    flexDirection: "row",
  },
  infoLabel: {
    color: "#111827",
    fontFamily: "serif",
    fontSize: 14,
    fontWeight: "700",
    minWidth: 84,
  },
  infoValue: {
    color: "#111827",
    flex: 1,
    fontFamily: "serif",
    fontSize: 14,
  },
  table: {
    borderColor: "#111827",
    borderWidth: 1,
  },
  headerRow: {
    backgroundColor: "#d1d5db",
    flexDirection: "row",
  },
  headerCell: {
    borderColor: "#111827",
    borderRightWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  headerCellText: {
    color: "#111827",
    fontFamily: "serif",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  bodyRow: {
    flexDirection: "row",
  },
  bodyCell: {
    borderColor: "#111827",
    borderRightWidth: 1,
    borderTopWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  bodyCellText: {
    color: "#111827",
    fontFamily: "serif",
    fontSize: 13,
  },
  textCenter: {
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },
  summaryWrap: {
    alignSelf: "flex-end",
    marginTop: -1,
    width: "46%",
  },
  summaryRow: {
    flexDirection: "row",
  },
  summaryLabel: {
    borderColor: "#111827",
    borderWidth: 1,
    color: "#111827",
    fontFamily: "serif",
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
    textAlign: "center",
    width: "62%",
  },
  summaryValue: {
    borderColor: "#111827",
    borderWidth: 1,
    borderLeftWidth: 0,
    color: "#111827",
    fontFamily: "serif",
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
    textAlign: "right",
    width: "38%",
  },
  summaryValueStrong: {
    fontWeight: "700",
  },
  remarkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  remarkLabel: {
    color: "#111827",
    fontFamily: "serif",
    fontSize: 14,
  },
  remarkLine: {
    borderBottomColor: "#111827",
    borderBottomWidth: 1,
    width: 110,
  },
  remarkText: {
    color: "#111827",
    flex: 1,
    fontFamily: "serif",
    fontSize: 13,
  },
  footerMeta: {
    borderTopColor: "#d4d4d4",
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 10,
  },
  footerMetaText: {
    color: "#6b7280",
    fontSize: 12,
    textAlign: "right",
  },
});
