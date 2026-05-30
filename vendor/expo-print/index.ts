import * as FileSystem from "expo-file-system/legacy";
import { Platform, Share } from "react-native";

import { createPdfDocument, htmlToPlainTextLines, sanitizePdfFileName } from "../../lib/simple-pdf";

export type PrintToFileOptions = {
  html: string;
  fileName?: string;
};

export type PrintResult = {
  uri: string;
  numberOfPages: number;
};

function buildPdf(lines: string[]) {
  return createPdfDocument({
    lines,
  });
}

async function writePdfToFile(uri: string, pdf: string) {
  await FileSystem.writeAsStringAsync(uri, pdf, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function printToFileAsync(options: PrintToFileOptions): Promise<PrintResult> {
  const lines = htmlToPlainTextLines(options.html);
  const pdf = buildPdf(lines);
  const fileName = sanitizePdfFileName(options.fileName ?? `label-slip-${Date.now()}.pdf`);

  if (Platform.OS === "web") {
    const blob = new Blob([pdf], { type: "application/pdf" });
    return {
      uri: URL.createObjectURL(blob),
      numberOfPages: 1,
    };
  }

  const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDirectory) {
    throw new Error("A writable file system directory is not available.");
  }

  const folder = `${baseDirectory}generated-label-slips/`;
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true }).catch(() => {});

  const uri = `${folder}${fileName}`;
  await writePdfToFile(uri, pdf);

  return {
    uri,
    numberOfPages: 1,
  };
}

export async function printAsync(options: PrintToFileOptions) {
  const result = await printToFileAsync(options);

  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      const printWindow = window.open(result.uri, "_blank", "noopener,noreferrer");
      printWindow?.focus();
    }
    return result;
  }

  await Share.share({
    url: result.uri,
    title: "Print label slip",
    message: "Open the generated PDF and use the system print action.",
  });

  return result;
}
