// src/lib/uploadToCloudflare.js

/**
 * OneMoreDay → Cloudflare R2 uploader (via Worker)
 * - Direct file uploads only (no pasted/external URLs)
 * - Optional client-side compression for images
 * - Returns a public CDN URL for the uploaded object
 */

export const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com' // your Worker
export const R2_PUBLIC = 'https://cdn.vibezcitizens.com'           // your public R2 domain

/** Build a public URL from an object key. */
export function publicUrlForKey(key) {
  const clean = String(key || '').replace(/^\/+/, '')
  return `${R2_PUBLIC}/${clean}`
}

/**
 * Upload a File/Blob to R2 through your Worker.
 * Expects the Worker to accept multipart form fields: file, key, path.
 *
 * @param {File|Blob} file - The binary to upload.
 * @param {string} key - Full object key, e.g. "omd/<userId>/<timestamp>-<uuid>.jpg"
 * @returns {Promise<{url: string|null, error: string|null}>}
 */
export async function uploadToCloudflare(file, key) {
  try {
    if (!file) return { url: null, error: 'No file provided' }
    if (!key) return { url: null, error: 'Missing storage key' }

    const form = new FormData()
    const filename = key.split('/').pop() || 'upload.bin'
    const path = key.split('/').slice(0, -1).join('/')

    form.append('file', file, filename)
    form.append('key', key)
    form.append('path', path)

    const res = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: form,
      // If your Worker requires authentication, add it here:
      // headers: { Authorization: `Bearer ${YOUR_TOKEN}` }
    })

    if (!res.ok) {
      const errorText = await safeText(res)
      return { url: null, error: errorText || `Upload failed (${res.status})` }
    }

    // Prefer Worker-returned URL; otherwise use our deterministic public URL
    const result = await safeJson(res)
    const url = (result && result.url) ? result.url : publicUrlForKey(key)
    return { url, error: null }
  } catch (err) {
    console.error('Cloudflare upload error:', err)
    return { url: null, error: err?.message || 'Unexpected upload error' }
  }
}

/**
 * Prepare a background job payload for your Service Worker queue (optional).
 * You still pass the actual File/Blob separately to your SW to attach as multipart.
 */
export function getBackgroundJob(file, key) {
  const filename = key.split('/').pop() || 'upload.bin'
  const path = key.split('/').slice(0, -1).join('/')

  return {
    url: UPLOAD_ENDPOINT,
    method: 'POST',
    headers: {
      // Add auth if your Worker needs it:
      // Authorization: `Bearer ${YOUR_TOKEN}`,
      // Don't set Content-Type; the browser will set the multipart boundary
    },
    fields: { key, path },
    filename,
    contentType: (file && file.type) || 'application/octet-stream',
    publicUrl: publicUrlForKey(key),
  }
}

/**
 * Compress an image file on-device before upload.
 * @param {File} file - Source image file
 * @param {number} maxSize - Max width/height in pixels (preserves aspect)
 * @param {number} quality - JPEG quality (0..1)
 * @returns {Promise<File>} - A new JPEG File (or throws on failure)
 */
export async function compressImageFile(file, maxSize = 1280, quality = 0.82) {
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('Invalid image file')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const ctx = canvas.getContext('2d', { alpha: false })
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const targetName = (file.name || 'upload').replace(/\.[^/.]+$/, '.jpg')

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Compression failed'))
          return
        }
        resolve(new File([blob], targetName, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      quality
    )
  })
}

// ——————— helpers ———————
async function safeJson(res) {
  try { return await res.json() } catch { return null }
}
async function safeText(res) {
  try { return await res.text() } catch { return '' }
}

// default export for convenience
export default uploadToCloudflare
