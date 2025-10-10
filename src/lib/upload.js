// /src/lib/upload.js
import { uploadToCloudflare, compressImageFile } from './uploadToCloudflare'
import { supabase } from '@/supabaseClient'

export async function uploadImage(file) {
  if (!file) return { url: null, error: 'No file' }

  // 1) (Optional) compress on-device to keep uploads fast/cheap
  let toSend = file
  try {
    toSend = await compressImageFile(file, 1280, 0.82) // ~max 1280px, JPEG ~82% quality
  } catch {
    // If compression fails, we still try the original
    toSend = file
  }

  // 2) Name it: userId + timestamp + uuid; keep a .jpg extension after compression
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id ?? 'anon'
  const key = `omd/${userId}/${Date.now()}-${crypto.randomUUID()}.jpg`

  // 3) Upload via your Cloudflare Worker
  const { url, error } = await uploadToCloudflare(toSend, key)
  return { url, error }
}
