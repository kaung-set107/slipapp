import { z } from "zod";

export type SlipSize = "invoice-a4" | "receipt-80mm";

export const slipTemplateMeta = {
  companyName: "Your Store Name",
  subtitle: "Distribution",
  phones: "PH : 09-962 229 996, 09-961 010 865",
  addressLine: "New York Street, AB1, CD2",
  receiptMessage: "Thank you for purchase !",
};

export const slipSizeOptions: Array<{ label: string; value: SlipSize; description: string }> = [
  {
    label: "A4 Invoice",
    value: "invoice-a4",
    description: "Full-page invoice with customer details, table, and totals.",
  },
  {
    label: "80mm Receipt",
    value: "receipt-80mm",
    description: "Narrow thermal receipt style like your sample image.",
  },
];

export type SlipItemFormValues = {
  itemName: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  taxPercent: string;
};

export type SlipFormValues = {
  slipSize: SlipSize;
  businessTitle: string;
  businessSubtitle: string;
  businessAddress: string;
  businessPhone: string;
  businessLogo: string;
  customerName: string;
  customerAddress: string;
  invoiceNo: string;
  salePerson: string;
  invoiceDate: string;
  cashReceived: string;
  remark: string;
  items: SlipItemFormValues[];
};

export type SlipItemData = {
  itemName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  lineSubtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
};

export type SlipTotals = {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
  itemCount: number;
};

export type SlipData = {
  slipSize: SlipSize;
  businessTitle: string;
  businessSubtitle: string;
  businessAddress: string;
  businessPhone: string;
  businessLogo: string;
  customerName: string;
  customerAddress: string;
  invoiceNo: string;
  salePerson: string;
  invoiceDate: string;
  cashReceived: number;
  remark: string;
  balance: number;
  items: SlipItemData[];
  totals: SlipTotals;
};

export type InvoiceTableRow = {
  no: string;
  itemName: string;
  qty: string;
  price: string;
  discount: string;
  amount: string;
  isPlaceholder?: boolean;
};

type SummaryRow = {
  label: string;
  value: string;
  emphasis?: boolean;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const slipItemSchema = z.object({
  itemName: z.string().trim().min(1, "Item name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or more"),
  discountPercent: z.coerce.number().min(0).max(100),
  taxPercent: z.coerce.number().min(0).max(100),
});

export const slipSchema = z.object({
  slipSize: z.string().trim().refine(
    (value) => value === "invoice-a4" || value === "receipt-80mm",
    "Slip size is required",
  ),
  businessTitle: z.string().trim().min(1, "Business title is required"),
  businessSubtitle: z.string().trim(),
  businessAddress: z.string().trim().min(1, "Business address is required"),
  businessPhone: z.string().trim().min(1, "Business phone is required"),
  businessLogo: z.string().trim(),
  customerName: z.string().trim().min(1, "Customer name is required"),
  customerAddress: z.string().trim(),
  invoiceNo: z.string().trim().min(1, "Invoice number is required"),
  salePerson: z.string().trim(),
  invoiceDate: z.string().trim().min(1, "Date is required"),
  cashReceived: z.coerce.number().min(0, "Cash received must be 0 or more"),
  remark: z.string().trim(),
  items: z.array(slipItemSchema).min(1, "Add at least one item"),
});

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyItem(): SlipItemFormValues {
  return {
    itemName: "",
    quantity: "1",
    unitPrice: "0",
    discountPercent: "0",
    taxPercent: "0",
  };
}

export function createInitialSlipForm(): SlipFormValues {
  return {
    slipSize: "invoice-a4",
    businessTitle: slipTemplateMeta.companyName,
    businessSubtitle: slipTemplateMeta.subtitle,
    businessAddress: slipTemplateMeta.addressLine,
    businessPhone: slipTemplateMeta.phones,
    businessLogo: "",
    customerName: "",
    customerAddress: "",
    invoiceNo: "",
    salePerson: "",
    invoiceDate: getTodayDateString(),
    cashReceived: "0",
    remark: "",
    items: [createEmptyItem()],
  };
}

export function parseSlipData(values: SlipFormValues) {
  return slipSchema.safeParse(values);
}

export function normalizeSlipItem(item: SlipItemFormValues): SlipItemData {
  const quantity = coerceNumber(item.quantity);
  const unitPrice = coerceNumber(item.unitPrice);
  const discountPercent = coerceNumber(item.discountPercent);
  const taxPercent = coerceNumber(item.taxPercent);
  const lineSubtotal = roundCurrency(quantity * unitPrice);
  const discountAmount = roundCurrency(lineSubtotal * (discountPercent / 100));
  const taxableAmount = roundCurrency(lineSubtotal - discountAmount);
  const taxAmount = roundCurrency(taxableAmount * (taxPercent / 100));
  const grandTotal = roundCurrency(taxableAmount + taxAmount);

  return {
    itemName: item.itemName.trim(),
    quantity,
    unitPrice,
    discountPercent,
    taxPercent,
    lineSubtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    grandTotal,
  };
}

function isSlipItemData(item: SlipItemFormValues | SlipItemData): item is SlipItemData {
  return (
    typeof (item as SlipItemData).lineSubtotal === "number" &&
    typeof (item as SlipItemData).discountAmount === "number" &&
    typeof (item as SlipItemData).taxableAmount === "number" &&
    typeof (item as SlipItemData).taxAmount === "number" &&
    typeof (item as SlipItemData).grandTotal === "number"
  );
}

export function calculateSlipTotals(items: Array<SlipItemFormValues | SlipItemData>): SlipTotals {
  const normalizedItems = items.map((item) =>
    isSlipItemData(item) ? item : normalizeSlipItem(item),
  );

  return normalizedItems.reduce<SlipTotals>(
    (totals, item) => ({
      subtotal: roundCurrency(totals.subtotal + item.lineSubtotal),
      discountAmount: roundCurrency(totals.discountAmount + item.discountAmount),
      taxableAmount: roundCurrency(totals.taxableAmount + item.taxableAmount),
      taxAmount: roundCurrency(totals.taxAmount + item.taxAmount),
      grandTotal: roundCurrency(totals.grandTotal + item.grandTotal),
      itemCount: totals.itemCount + 1,
    }),
    {
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      grandTotal: 0,
      itemCount: 0,
    },
  );
}

export function calculateLiveTotals(values: SlipFormValues): SlipTotals {
  return calculateSlipTotals(values.items);
}

export function calculateBalance(cashReceived: number, grandTotal: number) {
  return roundCurrency(cashReceived - grandTotal);
}

export function toSlipData(values: SlipFormValues): SlipData {
  const slipSize = values.slipSize;
  const businessTitle = values.businessTitle.trim();
  const businessSubtitle = values.businessSubtitle.trim();
  const businessAddress = values.businessAddress.trim();
  const businessPhone = values.businessPhone.trim();
  const businessLogo = values.businessLogo.trim();
  const customerName = values.customerName.trim();
  const customerAddress = values.customerAddress.trim();
  const invoiceNo = values.invoiceNo.trim();
  const salePerson = values.salePerson.trim();
  const invoiceDate = values.invoiceDate.trim();
  const cashReceived = coerceNumber(values.cashReceived);
  const remark = values.remark.trim();
  const items = values.items.map(normalizeSlipItem);
  const totals = calculateSlipTotals(items);

  return {
    slipSize,
    businessTitle,
    businessSubtitle,
    businessAddress,
    businessPhone,
    businessLogo,
    customerName,
    customerAddress,
    invoiceNo,
    salePerson,
    invoiceDate,
    cashReceived,
    remark,
    balance: calculateBalance(cashReceived, totals.grandTotal),
    items,
    totals,
  };
}

export function getSlipSummaryRows(data: SlipData): SummaryRow[] {
  return [
    { label: "Total amount", value: formatMoney(data.totals.grandTotal), emphasis: true },
    { label: "Cash receive", value: formatMoney(data.cashReceived) },
    { label: "Balance", value: formatMoney(data.balance) },
  ];
}

export function getReceiptSummaryRows(data: SlipData): SummaryRow[] {
  return [
    { label: "DISCOUNT", value: formatMoney(data.totals.discountAmount) },
    { label: "TOTAL", value: formatMoney(data.totals.grandTotal), emphasis: true },
    { label: "Cash", value: formatMoney(data.cashReceived) },
    { label: "Change", value: formatMoney(data.balance) },
  ];
}

export function getSlipItemRows(item: SlipItemData): SummaryRow[] {
  return [
    { label: "Qty", value: String(item.quantity) },
    { label: "Price", value: formatMoney(item.unitPrice) },
    { label: "Discount", value: formatPercent(item.discountPercent) },
    { label: "Tax", value: formatPercent(item.taxPercent) },
    { label: "Amount", value: formatMoney(item.grandTotal), emphasis: true },
  ];
}

export function getInvoiceTableRows(data: SlipData, minimumRows = 4): InvoiceTableRow[] {
  const rows: InvoiceTableRow[] = data.items.map((item, index) => ({
    no: String(index + 1),
    itemName: item.itemName,
    qty: String(item.quantity),
    price: formatMoney(item.unitPrice),
    discount: formatPercent(item.discountPercent),
    amount: formatMoney(item.grandTotal),
  }));

  while (rows.length < minimumRows) {
    rows.push({
      no: "",
      itemName: "",
      qty: "",
      price: "",
      discount: "",
      amount: "",
      isPlaceholder: true,
    });
  }

  return rows;
}

export function getReceiptRows(data: SlipData) {
  return data.items.map((item, index) => ({
    no: `${index + 1}.`,
    name: item.itemName,
    amount: formatMoney(item.grandTotal),
  }));
}

export function buildSlipHtml(data: SlipData) {
  if (data.slipSize === "receipt-80mm") {
    return buildReceiptHtml(data);
  }

  return buildInvoiceHtml(data);
}

function buildInvoiceHtml(data: SlipData) {
  const rows = getInvoiceTableRows(data, 6);
  const summaryRows = getSlipSummaryRows(data);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sale Invoice</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        color: #111827;
        background: #ffffff;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 18mm 14mm 20mm;
      }
      .header {
        text-align: center;
        margin-bottom: 14px;
      }
      .logo {
        height: 54px;
        margin-bottom: 10px;
        max-width: 140px;
        object-fit: contain;
      }
      .company-name {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
      .subtitle {
        font-size: 17px;
        font-weight: 700;
        margin-top: 2px;
      }
      .phones {
        font-size: 12px;
        font-weight: 700;
        margin-top: 10px;
      }
      .rule {
        border-top: 2px dashed #111827;
        margin: 16px 0 18px;
      }
      .topline {
        display: flex;
        justify-content: space-between;
        font-weight: 700;
        margin-bottom: 10px;
      }
      .info-grid {
        display: table;
        width: 100%;
        margin-bottom: 22px;
      }
      .info-row {
        display: table-row;
      }
      .info-cell {
        display: table-cell;
        width: 25%;
        padding: 4px 0;
        font-size: 14px;
        vertical-align: top;
      }
      .label {
        font-weight: 700;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      th, td {
        border: 1px solid #111827;
        padding: 7px 8px;
        font-size: 13px;
      }
      th {
        background: #d1d5db;
        font-weight: 700;
        text-align: center;
      }
      td.center {
        text-align: center;
      }
      td.right {
        text-align: right;
      }
      .summary-wrap {
        width: 46%;
        margin-left: auto;
        margin-top: -1px;
      }
      .summary-row {
        display: flex;
      }
      .summary-label,
      .summary-value {
        border: 1px solid #111827;
        padding: 6px 10px;
        font-size: 13px;
      }
      .summary-label {
        width: 62%;
        text-align: center;
      }
      .summary-value {
        width: 38%;
        text-align: right;
      }
      .remark {
        margin-top: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
      }
      .remark-line {
        flex: 0 0 160px;
        border-bottom: 1px solid #111827;
        min-height: 16px;
      }
      .remark-text {
        margin-left: 8px;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        ${data.businessLogo ? `<img class="logo" src="${escapeAttribute(data.businessLogo)}" alt="Business logo" />` : ""}
        <div class="company-name">${escapeHtml(data.businessTitle)}</div>
        ${data.businessSubtitle ? `<div class="subtitle">${escapeHtml(data.businessSubtitle)}</div>` : ""}
        <div class="phones">${escapeHtml(data.businessAddress)}</div>
        <div class="phones">${escapeHtml(data.businessPhone)}</div>
      </div>
      <div class="rule"></div>
      <div class="topline">
        <div>Sale Invoice</div>
        <div>Date: ${escapeHtml(data.invoiceDate)}</div>
      </div>
      <div class="info-grid">
        <div class="info-row">
          <div class="info-cell"><span class="label">Customer</span></div>
          <div class="info-cell">: ${escapeHtml(data.customerName)}</div>
          <div class="info-cell"><span class="label">Invoice No</span></div>
          <div class="info-cell">: ${escapeHtml(data.invoiceNo)}</div>
        </div>
        <div class="info-row">
          <div class="info-cell"><span class="label">Address</span></div>
          <div class="info-cell">: ${escapeHtml(data.customerAddress || "-")}</div>
          <div class="info-cell"><span class="label">Sale Person</span></div>
          <div class="info-cell">: ${escapeHtml(data.salePerson || "-")}</div>
        </div>
        <div class="info-row">
          <div class="info-cell"><span class="label">Invoice Date</span></div>
          <div class="info-cell">: ${escapeHtml(data.invoiceDate)}</div>
          <div class="info-cell"></div>
          <div class="info-cell"></div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">No.</th>
            <th style="width: 38%;">Item name</th>
            <th style="width: 9%;">Qty</th>
            <th style="width: 14%;">Price</th>
            <th style="width: 15%;">Discount</th>
            <th style="width: 16%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <td class="center">${escapeHtml(row.no)}</td>
              <td>${escapeHtml(row.itemName)}</td>
              <td class="center">${escapeHtml(row.qty)}</td>
              <td class="right">${escapeHtml(row.price)}</td>
              <td class="center">${escapeHtml(row.discount)}</td>
              <td class="right">${escapeHtml(row.amount)}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <div class="summary-wrap">
        ${summaryRows
          .map(
            (row) => `
          <div class="summary-row">
            <div class="summary-label">${escapeHtml(row.label)}</div>
            <div class="summary-value">${escapeHtml(row.value)}</div>
          </div>`,
          )
          .join("")}
      </div>
      <div class="remark">
        <div>Remark</div>
        <div class="remark-line"></div>
        <div class="remark-text">${escapeHtml(data.remark || "")}</div>
      </div>
    </div>
  </body>
</html>`;
}

function buildReceiptHtml(data: SlipData) {
  const rows = getReceiptRows(data);
  const summaryRows = getReceiptSummaryRows(data);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #ffffff;
        color: #202020;
        font-family: "Courier New", Courier, monospace;
      }
      .receipt {
        width: 80mm;
        margin: 0 auto;
        padding: 8mm 5mm 10mm;
      }
      .center {
        text-align: center;
      }
      .logo {
        display: block;
        height: 52px;
        margin: 0 auto 10px;
        max-width: 120px;
        object-fit: contain;
      }
      .shop-name {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 2px;
      }
      .meta-line {
        font-size: 14px;
        line-height: 1.35;
      }
      .separator {
        text-align: center;
        font-size: 16px;
        margin: 10px 0 8px;
        letter-spacing: 0.5px;
      }
      .receipt-no {
        font-size: 16px;
        margin-bottom: 4px;
      }
      .date-line {
        font-size: 15px;
      }
      .item-row,
      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
      }
      .item-block {
        margin: 12px 0;
      }
      .item-row {
        font-size: 15px;
        line-height: 1.5;
      }
      .item-label {
        flex: 1;
        padding-right: 6px;
      }
      .item-amount {
        min-width: 90px;
        text-align: right;
      }
      .summary-block {
        margin-top: 12px;
      }
      .summary-row {
        font-size: 15px;
        line-height: 1.5;
      }
      .summary-row.total {
        font-size: 16px;
        font-weight: 700;
      }
      .summary-label {
        flex: 1;
      }
      .summary-value {
        min-width: 90px;
        text-align: right;
      }
      .thanks {
        margin-top: 12px;
        font-size: 16px;
        text-align: center;
      }
      .remark {
        margin-top: 6px;
        font-size: 13px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="center">
        ${data.businessLogo ? `<img class="logo" src="${escapeAttribute(data.businessLogo)}" alt="Business logo" />` : ""}
        <div class="shop-name">${escapeHtml(data.businessTitle)}</div>
        ${data.businessSubtitle ? `<div class="meta-line">${escapeHtml(data.businessSubtitle)}</div>` : ""}
        <div class="meta-line">${escapeHtml(data.businessAddress)}</div>
        <div class="meta-line">${escapeHtml(data.businessPhone)}</div>
      </div>

      <div class="separator">===========================</div>
      <div class="center receipt-no">Receipt No ${escapeHtml(data.invoiceNo)}</div>
      <div class="center date-line">Date: ${escapeHtml(data.invoiceDate)}</div>
      <div class="separator">===========================</div>

      <div class="item-block">
        ${rows
          .map(
            (row) => `
          <div class="item-row">
            <div class="item-label">${escapeHtml(row.no)} ${escapeHtml(row.name)}</div>
            <div class="item-amount">${escapeHtml(row.amount)}</div>
          </div>`,
          )
          .join("")}
      </div>

      <div class="separator">---------------------------</div>

      <div class="summary-block">
        ${summaryRows
          .map(
            (row) => `
          <div class="summary-row ${row.emphasis ? "total" : ""}">
            <div class="summary-label">${escapeHtml(row.label)}</div>
            <div class="summary-value">${escapeHtml(row.value)}</div>
          </div>`,
          )
          .join("")}
      </div>

      <div class="separator">===========================</div>
      <div class="thanks">${escapeHtml(slipTemplateMeta.receiptMessage)}</div>
      <div class="remark">${escapeHtml(data.remark || "")}</div>
    </div>
  </body>
</html>`;
}

export function buildSlipFileName(data: SlipData) {
  const customer = slugify(data.customerName || data.invoiceNo);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const prefix = data.slipSize === "receipt-80mm" ? "receipt" : "sale-invoice";
  return `${prefix}-${customer || "document"}-${stamp}.pdf`;
}

export function buildWordFileName(data: SlipData) {
  return buildSlipFileName(data).replace(/\.pdf$/i, ".doc");
}

export function buildDocumentBaseName(data: SlipData) {
  return buildSlipFileName(data).replace(/\.pdf$/i, "");
}

export function buildWordHtml(data: SlipData) {
  if (data.slipSize === "receipt-80mm") {
    return buildReceiptWordHtml(data);
  }

  return buildInvoiceWordHtml(data);
}

export function formatMoney(value: number) {
  return moneyFormatter.format(roundCurrency(value));
}

export function formatPercent(value: number) {
  if (value === 0) {
    return "-";
  }

  return Number.isInteger(value) ? `${value}%` : `${roundCurrency(value).toFixed(2)}%`;
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function coerceNumber(value: string | number | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = (value ?? "").trim();
  if (normalized.length === 0) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function buildInvoiceWordHtml(data: SlipData) {
  const rows = getInvoiceTableRows(data, 6);
  const summaryRows = getSlipSummaryRows(data);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Sale Invoice</title>
    <style>
      @page {
        size: A4;
        margin: 18mm 14mm 20mm;
      }
      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        color: #111827;
        background: #ffffff;
      }
      .page {
        width: 100%;
      }
      .header {
        text-align: center;
        margin-bottom: 14px;
      }
      .logo {
        display: block;
        height: 54px;
        margin: 0 auto 10px;
        max-width: 140px;
      }
      .company-name {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
      .subtitle {
        font-size: 17px;
        font-weight: 700;
        margin-top: 2px;
      }
      .phones {
        font-size: 12px;
        font-weight: 700;
        margin-top: 10px;
      }
      .rule {
        border-top: 2px dashed #111827;
        margin: 16px 0 18px;
      }
      .topline-table,
      .info-table,
      .items-table,
      .summary-table,
      .remark-table {
        border-collapse: collapse;
        width: 100%;
      }
      .topline-table td {
        font-size: 16px;
        font-weight: 700;
        padding: 0 0 10px;
      }
      .align-right {
        text-align: right;
      }
      .info-table td {
        font-size: 14px;
        padding: 4px 0;
        vertical-align: top;
      }
      .info-label {
        font-weight: 700;
        width: 18%;
      }
      .info-value {
        width: 32%;
      }
      .items-table {
        margin-top: 12px;
        table-layout: fixed;
      }
      .items-table th,
      .items-table td {
        border: 1px solid #111827;
        font-size: 13px;
        padding: 7px 8px;
      }
      .items-table th {
        background: #d1d5db;
        font-weight: 700;
        text-align: center;
      }
      .items-table td.center {
        text-align: center;
      }
      .items-table td.right {
        text-align: right;
      }
      .summary-wrap {
        margin-left: auto;
        margin-top: 0;
        width: 46%;
      }
      .summary-table td {
        border: 1px solid #111827;
        font-size: 13px;
        padding: 6px 10px;
      }
      .summary-label {
        text-align: center;
        width: 62%;
      }
      .summary-value {
        text-align: right;
        width: 38%;
      }
      .remark-table {
        margin-top: 24px;
      }
      .remark-table td {
        font-size: 14px;
        vertical-align: middle;
      }
      .remark-label {
        width: 54px;
      }
      .remark-line {
        border-bottom: 1px solid #111827;
        width: 160px;
      }
      .remark-text {
        padding-left: 12px;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        ${data.businessLogo ? `<img class="logo" src="${escapeAttribute(data.businessLogo)}" alt="Business logo" />` : ""}
        <div class="company-name">${escapeHtml(data.businessTitle)}</div>
        ${data.businessSubtitle ? `<div class="subtitle">${escapeHtml(data.businessSubtitle)}</div>` : ""}
        <div class="phones">${escapeHtml(data.businessAddress)}</div>
        <div class="phones">${escapeHtml(data.businessPhone)}</div>
      </div>
      <div class="rule"></div>

      <table class="topline-table">
        <tr>
          <td>Sale Invoice</td>
          <td class="align-right">Date: ${escapeHtml(data.invoiceDate)}</td>
        </tr>
      </table>

      <table class="info-table">
        <tr>
          <td class="info-label">Customer</td>
          <td class="info-value">: ${escapeHtml(data.customerName)}</td>
          <td class="info-label">Invoice No</td>
          <td class="info-value">: ${escapeHtml(data.invoiceNo)}</td>
        </tr>
        <tr>
          <td class="info-label">Address</td>
          <td class="info-value">: ${escapeHtml(data.customerAddress || "-")}</td>
          <td class="info-label">Sale Person</td>
          <td class="info-value">: ${escapeHtml(data.salePerson || "-")}</td>
        </tr>
        <tr>
          <td class="info-label">Invoice Date</td>
          <td class="info-value">: ${escapeHtml(data.invoiceDate)}</td>
          <td class="info-label"></td>
          <td class="info-value"></td>
        </tr>
      </table>

      <table class="items-table">
        <tr>
          <th style="width: 8%;">No.</th>
          <th style="width: 38%;">Item name</th>
          <th style="width: 9%;">Qty</th>
          <th style="width: 14%;">Price</th>
          <th style="width: 15%;">Discount</th>
          <th style="width: 16%;">Amount</th>
        </tr>
        ${rows
          .map(
            (row) => `
        <tr>
          <td class="center">${escapeHtml(row.no)}</td>
          <td>${escapeHtml(row.itemName)}</td>
          <td class="center">${escapeHtml(row.qty)}</td>
          <td class="right">${escapeHtml(row.price)}</td>
          <td class="center">${escapeHtml(row.discount)}</td>
          <td class="right">${escapeHtml(row.amount)}</td>
        </tr>`,
          )
          .join("")}
      </table>

      <div class="summary-wrap">
        <table class="summary-table">
          ${summaryRows
            .map(
              (row) => `
          <tr>
            <td class="summary-label">${escapeHtml(row.label)}</td>
            <td class="summary-value"><strong>${escapeHtml(row.value)}</strong></td>
          </tr>`,
            )
            .join("")}
        </table>
      </div>

      <table class="remark-table">
        <tr>
          <td class="remark-label">Remark</td>
          <td class="remark-line"></td>
          <td class="remark-text">${escapeHtml(data.remark || "")}</td>
        </tr>
      </table>
    </div>
  </body>
</html>`;
}

function buildReceiptWordHtml(data: SlipData) {
  const rows = getReceiptRows(data);
  const summaryRows = getReceiptSummaryRows(data);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Receipt</title>
    <style>
      @page {
        size: 80mm auto;
        margin: 8mm 5mm 10mm;
      }
      body {
        margin: 0;
        color: #202020;
        background: #ffffff;
        font-family: "Courier New", Courier, monospace;
      }
      .receipt {
        width: 100%;
        max-width: 80mm;
        margin: 0 auto;
      }
      .center {
        text-align: center;
      }
      .logo {
        display: block;
        height: 52px;
        margin: 0 auto 10px;
        max-width: 120px;
      }
      .shop-name {
        font-size: 22px;
        font-weight: 700;
      }
      .meta-line {
        font-size: 14px;
        line-height: 1.35;
      }
      .separator {
        font-size: 16px;
        letter-spacing: 0.5px;
        margin: 10px 0 8px;
        text-align: center;
      }
      .receipt-no,
      .date-line {
        font-size: 16px;
        text-align: center;
      }
      .items-table,
      .summary-table {
        border-collapse: collapse;
        width: 100%;
      }
      .items-table {
        margin-top: 12px;
      }
      .items-table td,
      .summary-table td {
        font-size: 15px;
        padding: 4px 0;
        vertical-align: top;
      }
      .items-label,
      .summary-label {
        width: 68%;
      }
      .items-amount,
      .summary-value {
        text-align: right;
        width: 32%;
      }
      .summary-table {
        margin-top: 8px;
      }
      .total-row td {
        font-size: 16px;
        font-weight: 700;
      }
      .thanks {
        font-size: 16px;
        margin-top: 12px;
        text-align: center;
      }
      .remark {
        font-size: 13px;
        margin-top: 6px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="center">
        ${data.businessLogo ? `<img class="logo" src="${escapeAttribute(data.businessLogo)}" alt="Business logo" />` : ""}
        <div class="shop-name">${escapeHtml(data.businessTitle)}</div>
        ${data.businessSubtitle ? `<div class="meta-line">${escapeHtml(data.businessSubtitle)}</div>` : ""}
        <div class="meta-line">${escapeHtml(data.businessAddress)}</div>
        <div class="meta-line">${escapeHtml(data.businessPhone)}</div>
      </div>

      <div class="separator">===========================</div>
      <div class="receipt-no">Receipt No ${escapeHtml(data.invoiceNo)}</div>
      <div class="date-line">Date: ${escapeHtml(data.invoiceDate)}</div>
      <div class="separator">===========================</div>

      <table class="items-table">
        ${rows
          .map(
            (row) => `
        <tr>
          <td class="items-label">${escapeHtml(row.no)} ${escapeHtml(row.name)}</td>
          <td class="items-amount">${escapeHtml(row.amount)}</td>
        </tr>`,
          )
          .join("")}
      </table>

      <div class="separator">---------------------------</div>

      <table class="summary-table">
        ${summaryRows
          .map(
            (row) => `
        <tr class="${row.emphasis ? "total-row" : ""}">
          <td class="summary-label">${escapeHtml(row.label)}</td>
          <td class="summary-value">${escapeHtml(row.value)}</td>
        </tr>`,
          )
          .join("")}
      </table>

      <div class="separator">===========================</div>
      <div class="thanks">${escapeHtml(slipTemplateMeta.receiptMessage)}</div>
      <div class="remark">${escapeHtml(data.remark || "")}</div>
    </div>
  </body>
</html>`;
}
