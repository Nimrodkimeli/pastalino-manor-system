function dataUrlToBlobUrl(dataUrl) {
  const parts = String(dataUrl || "").split(",");
  if (parts.length < 2) {
    return "";
  }

  const meta = parts[0] || "";
  const payload = parts.slice(1).join(",");
  const mimeMatch = meta.match(/^data:(.*?);base64$/i);
  const mimeType = mimeMatch?.[1] || "application/octet-stream";

  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export function openDocumentInNewTab(fileUrl) {
  const url = String(fileUrl || "").trim();
  if (!url) {
    return false;
  }

  const viewUrl = url.startsWith("data:") ? dataUrlToBlobUrl(url) : url;
  if (!viewUrl) {
    return false;
  }

  const popup = window.open(viewUrl, "_blank");
  if (!popup) {
    alert("Popup blocked. Please allow popups to view the uploaded document.");
    if (viewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(viewUrl);
    }
    return false;
  }

  if (viewUrl.startsWith("blob:")) {
    setTimeout(() => {
      URL.revokeObjectURL(viewUrl);
    }, 60_000);
  }

  return true;
}
