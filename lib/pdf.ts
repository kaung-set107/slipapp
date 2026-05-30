import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { sanitizePdfFileName as sanitizeFileName } from "@/lib/simple-pdf";

import type { SlipSize } from "@/lib/slip";

type DocumentLayoutOptions = {
  slipSize: SlipSize;
  itemCount?: number;
};

const A4_PAGE = {
  width: 595,
  height: 842,
};

const RECEIPT_PAGE = {
  width: 227,
  baseHeight: 420,
  rowHeight: 28,
  minHeight: 560,
};

function getDownloadsFolder() {
  return FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? null;
}

function triggerBrowserDownload(uri: string, fileName: string) {
  if (typeof document === "undefined") {
    return;
  }

  const link = document.createElement("a");
  link.href = uri;
  link.download = fileName;
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function triggerBrowserTextDownload(contents: string, fileName: string, mimeType: string) {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return;
  }

  const blob = new Blob([contents], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 0);
}

function getPrintLayoutOptions(layout: DocumentLayoutOptions) {
  if (layout.slipSize === "receipt-80mm") {
    const height = Math.max(
      RECEIPT_PAGE.minHeight,
      RECEIPT_PAGE.baseHeight + (layout.itemCount ?? 0) * RECEIPT_PAGE.rowHeight,
    );

    return {
      width: RECEIPT_PAGE.width,
      height,
    };
  }

  return A4_PAGE;
}

async function writeTextFileAsync(destination: string, contents: string) {
  await FileSystem.writeAsStringAsync(destination, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

async function createManagedDocumentFileAsync(
  fileName: string,
  contents: string,
  mimeType: string,
) {
  const cleanFileName = sanitizeFileName(fileName);

  if (Platform.OS === "web") {
    triggerBrowserTextDownload(contents, cleanFileName, mimeType);
    return cleanFileName;
  }

  if (Platform.OS === "android" && FileSystem.StorageAccessFramework) {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      const destination = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        cleanFileName,
        mimeType,
      );

      await writeTextFileAsync(destination, contents);
      return destination;
    }
  }

  const baseFolder = getDownloadsFolder();
  if (!baseFolder) {
    return cleanFileName;
  }

  const folder = `${baseFolder}label-slips/`;
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true }).catch(() => {});

  const destination = `${folder}${cleanFileName}`;
  await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => {});
  await writeTextFileAsync(destination, contents);

  return destination;
}

export async function createSlipPdfAsync(html: string, layout: DocumentLayoutOptions) {
  return Print.printToFileAsync({
    html,
    ...getPrintLayoutOptions(layout),
  });
}

export async function saveSlipPdfAsync(
  html: string,
  fileName: string,
  layout: DocumentLayoutOptions,
) {
  const cleanFileName = sanitizeFileName(fileName);
  const result = await createSlipPdfAsync(html, layout);

  if (Platform.OS === "web") {
    triggerBrowserDownload(result.uri, cleanFileName);
    return result.uri;
  }

  if (Platform.OS === "android" && FileSystem.StorageAccessFramework) {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      const destination = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        cleanFileName,
        "application/pdf",
      );

      const contents = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.writeAsStringAsync(destination, contents, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return destination;
    }
  }

  const baseFolder = getDownloadsFolder();
  if (!baseFolder) {
    return result.uri;
  }

  const folder = `${baseFolder}label-slips/`;
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true }).catch(() => {});

  const destination = `${folder}${cleanFileName}`;
  await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => {});
  await FileSystem.copyAsync({
    from: result.uri,
    to: destination,
  });

  return destination;
}

export async function saveWordDocumentAsync(html: string, fileName: string) {
  return createManagedDocumentFileAsync(
    fileName,
    htmlFileToWordDocument(html),
    "application/msword",
  );
}

export async function shareSlipPdfAsync(
  html: string,
  fileName: string,
  layout: DocumentLayoutOptions,
) {
  const result = await createSlipPdfAsync(html, layout);
  await Sharing.shareAsync(result.uri, {
    dialogTitle: "Share label slip",
    mimeType: "application/pdf",
  });
  return result.uri;
}

export async function printSlipPdfAsync(
  html: string,
  _fileName: string,
  layout: DocumentLayoutOptions,
) {
  return Print.printAsync({
    html,
    ...getPrintLayoutOptions(layout),
  });
}

function htmlFileToWordDocument(html: string) {
  const headContent = extractTagContents(html, "head");
  const bodyContent = extractTagContents(html, "body") || html;

  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <meta name="ProgId" content="Word.Document" />
    <meta name="Generator" content="Expo Slip Builder" />
    <meta name="Originator" content="Expo Slip Builder" />
    ${headContent}
  </head>
  <body>
    ${bodyContent}
  </body>
</html>`;
}

function extractTagContents(html: string, tagName: "head" | "body") {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? match[1] : html;
}
