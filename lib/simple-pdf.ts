type PdfOptions = {
  lines: string[];
  title?: string;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 48;
const TOP_MARGIN = 64;
const LINE_HEIGHT = 16;
const MAX_LINE_LENGTH = 44;

function toPrintableText(text: string) {
  return text.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?");
}

function escapePdfText(text: string) {
  return toPrintableText(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(line: string, maxLength: number) {
  const output: string[] = [];
  let remaining = line.trim();

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf(" ", maxLength);
    if (splitAt <= 0) {
      splitAt = maxLength;
    }

    output.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }

  if (remaining.length > 0) {
    output.push(remaining);
  }

  if (output.length === 0) {
    output.push("");
  }

  return output;
}

function wrapLines(lines: string[]) {
  return lines.flatMap((line) => wrapLine(line, MAX_LINE_LENGTH));
}

function buildContentStream(lines: string[]) {
  const wrappedLines = wrapLines(lines);
  const textOperations: string[] = ["BT", "/F1 12 Tf", "14 TL", `1 0 0 1 ${LEFT_MARGIN} ${PAGE_HEIGHT - TOP_MARGIN} Tm`];

  wrappedLines.forEach((line, index) => {
    const escaped = escapePdfText(line);
    if (index === 0) {
      textOperations.push(`(${escaped}) Tj`);
      return;
    }

    textOperations.push("T*");
    textOperations.push(`(${escaped}) Tj`);
  });

  textOperations.push("ET");
  return textOperations.join("\n");
}

function createPdfObjects(contentStream: string) {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  return objects;
}

export function htmlToPlainTextLines(html: string) {
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li|tr|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

export function createPdfDocument({ lines }: PdfOptions) {
  const contentStream = buildContentStream(lines);
  const objects = createPdfObjects(contentStream);

  let output = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(output.length);
    output += object;
  }

  const xrefStart = output.length;
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    output += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }

  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return output;
}

export function sanitizePdfFileName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned.length > 0 ? cleaned : "label-slip.pdf";
}
