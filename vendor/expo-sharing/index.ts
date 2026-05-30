import { Platform, Share } from "react-native";

export type ShareAsyncOptions = {
  dialogTitle?: string;
  mimeType?: string;
};

function shareOnWeb(uri: string, title?: string) {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    return (navigator as Navigator & { share: (data: { title?: string; url?: string }) => Promise<void> }).share({
      title,
      url: uri,
    });
  }

  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  const link = document.createElement("a");
  link.href = uri;
  link.download = title || "label-slip.pdf";
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  return Promise.resolve();
}

export async function isAvailableAsync() {
  return true;
}

export async function shareAsync(uri: string, options: ShareAsyncOptions = {}) {
  if (Platform.OS === "web") {
    await shareOnWeb(uri, options.dialogTitle);
    return;
  }

  await Share.share({
    url: uri,
    title: options.dialogTitle ?? "Share label slip",
    message: options.dialogTitle ?? "Share label slip",
  });
}
