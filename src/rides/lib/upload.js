// src/rides/lib/upload.js
// Minimal uploader for Cloudflare Worker @ https://upload.vibezcitizens.com
// Expects the worker to return JSON: { url: "https://cdn.vibezcitizens.com/..." }

export async function uploadImageToR2(file) {
  if (!file) return null;

  const endpoint = "https://upload.vibezcitizens.com";
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(endpoint, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json().catch(() => null);
  if (!data?.url) {
    throw new Error("Upload did not return a URL");
  }
  return data.url; // e.g., https://cdn.vibezcitizens.com/abc123.jpg
}
