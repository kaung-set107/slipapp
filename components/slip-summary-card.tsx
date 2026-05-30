import { Text, View, StyleSheet } from "react-native";

import { formatMoney } from "@/lib/slip";

type SummaryRow = {
  label: string;
  value: string;
  emphasis?: boolean;
};

type SlipSummaryCardProps = {
  title: string;
  subtitle?: string;
  rows: SummaryRow[];
};

export function SlipSummaryCard({ title, subtitle, rows }: SlipSummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.rows}>
        {rows.map((row) => (
          <View
            key={row.label}
            style={[styles.row, row.emphasis ? styles.emphasisRow : undefined]}
          >
            <Text style={[styles.label, row.emphasis ? styles.emphasisLabel : undefined]}>
              {row.label}
            </Text>
            <Text style={[styles.value, row.emphasis ? styles.emphasisValue : undefined]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type MoneyCardProps = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  cashReceived?: number;
  balance?: number;
};

export function MoneyCard({
  subtotal,
  discountAmount,
  taxAmount,
  grandTotal,
  cashReceived,
  balance,
}: MoneyCardProps) {
  return (
    <SlipSummaryCard
      title="Live calculation"
      subtitle="Totals update as you type"
      rows={[
        { label: "Subtotal", value: formatMoney(subtotal) },
        { label: "Discount", value: `-${formatMoney(discountAmount)}` },
        { label: "Tax", value: formatMoney(taxAmount) },
        { label: "Grand total", value: formatMoney(grandTotal), emphasis: true },
        ...(typeof cashReceived === "number"
          ? [{ label: "Cash receive", value: formatMoney(cashReceived) }]
          : []),
        ...(typeof balance === "number"
          ? [{ label: "Balance", value: formatMoney(balance) }]
          : []),
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ee",
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#0f172a",
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
  },
  rows: {
    gap: 12,
  },
  row: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emphasisRow: {
    backgroundColor: "#0f172a",
  },
  label: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
  emphasisLabel: {
    color: "#cbd5e1",
  },
  emphasisValue: {
    color: "#ffffff",
    fontSize: 16,
  },
});
