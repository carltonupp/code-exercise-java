export function normalizeDestination(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedValue);
  const candidate = hasScheme ? trimmedValue : `https://${trimmedValue}`;
  try {
    const url = new URL(candidate);
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      isUsableHostname(url.hostname)
    ) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function isUsableHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  if (normalized === "localhost" || (normalized.startsWith("[") && normalized.endsWith("]"))) {
    return true;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) return true;

  const labels = normalized.split(".");
  return (
    labels.length >= 2 &&
    labels.every((label) => label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)) &&
    labels[labels.length - 1].length >= 2
  );
}

export function isValidAlias(alias: string) {
  return /^[A-Za-z0-9-]{3,16}$/.test(alias);
}
