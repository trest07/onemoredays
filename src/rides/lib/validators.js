// somewhere shared, e.g. src/rides/lib/validators.js
export function isAllowedImageURL(u, allowedHosts) {
  try {
    const url = new URL(u);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    return allowedHosts.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
