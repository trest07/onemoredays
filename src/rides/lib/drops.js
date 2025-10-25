// src/rides/lib/drops.js
import { supabase } from '@/supabaseClient'

/* -------------------------------- helpers -------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// backoff only for 429s; succeeds fast otherwise
async function withBackoff(fn, { tries = 3, base = 250 } = {}) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      const is429 = e?.status === 429 || /Too Many Requests/i.test(e?.message)
      if (!is429 || i === tries - 1) throw e
      await sleep(base * Math.pow(2, i) + Math.floor(Math.random() * 120))
    }
  }
  throw lastErr
}

function coerceMediaUrls(input) {
  if (!input) return null
  if (Array.isArray(input)) {
    const arr = input.filter(Boolean).map(String).slice(0, 3)
    return arr.length ? arr : null
  }
  const one = String(input).trim()
  return one ? [one] : null
}

// session caches (not persistent)
const _viewCountCache = new Map() // pinId -> number

/** Stable device id for guests (stored in localStorage). */
function getDeviceId() {
  try {
    const KEY = 'omd.device_id.v1'
    let v = localStorage.getItem(KEY)
    if (!v) {
      v = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(KEY, v)
    }
    return v
  } catch {
    return null
  }
}

/* -------------------------------- Pins (public feed) ------------------------------- */

/**
 * Fetch pins for the public map, newest first.
 * Normalizes profile fields to top-level keys your UI expects:
 *   display_name, username, avatar_url
 *
 * NOTE: make sure your view `omd.pins_with_profile` selects `media_urls` and `image_url`.
 */
export async function fetchActiveDrops(_spaceId) {
  const { data, error } = await withBackoff(() =>
    supabase
      .schema('omd')
      .from('pins_with_profile')
      .select('*')
      .order('created_at', { ascending: false })
  )
  if (error) throw error

  return (data ?? []).map((r) => ({
    ...r,
    display_name:
      r.display_name ??
      r.profiles_display_name ??
      r.profile_display_name ??
      null,
    username:
      r.username ??
      r.profiles_username ??
      r.profile_username ??
      null,
    avatar_url:
      r.avatar_url ??
      r.photo_url ??
      r.profiles_photo_url ??
      null,
    media_urls: coerceMediaUrls(r.media_urls),
    image_url: r.image_url ?? r.media_url ?? null,
  }))
}

/**
 * Fetch my own pins (requires a signed-in user).
 */
export async function fetchMyDrops({ userId }) {
  if (!userId) throw new Error('Missing userId')

  const { data, error } = await withBackoff(() =>
    supabase
      .schema('omd')
      .from('pins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  )
  if (error) throw error

  return (data ?? []).map((r) => ({
    ...r,
    media_urls: coerceMediaUrls(r.media_urls),
  }))
}

/**
 * Create a new pin.
 * Fields: { lat, lng, note, media_url, media_urls, link_url, is_private }
 * - media_url (legacy single) is stored into image_url
 * - media_urls (array) is stored into media_urls (jsonb)
 *   If media_urls is provided and media_url is not, we set image_url = media_urls[0].
 */
export async function addDrop(
  _spaceId,
  { lat, lng, note, media_url, media_urls, link_url, is_private = false } = {}
) {
  const mUrls = coerceMediaUrls(media_urls)
  const legacy = media_url || (mUrls && mUrls.length ? mUrls[0] : null)

  const insert = {
    lat,
    lng,
    note: note || null,
    image_url: legacy || null,     // legacy single
    media_urls: mUrls || null,     // new multi
    link_url: link_url || null,
    is_private,
  }

  const { data, error } = await withBackoff(() =>
    supabase
      .schema('omd')
      .from('pins')
      .insert(insert)
      .select()
      .single()
  )
  if (error) throw error
  return data
}

/**
 * Update a pin (owner-only via RLS). Only whitelisted fields are updatable.
 */
export async function updateDrop(id, fields = {}) {
  if (!id) throw new Error('Missing id')

  const allowed = [
    'note',
    'link_url',
    'is_private',
    'image_url',   // legacy single
    'media_urls',  // new multi
    'lat',
    'lng',
  ]

  const patch = {}
  for (const k of allowed) {
    if (k in fields) {
      patch[k] = (k === 'media_urls') ? coerceMediaUrls(fields[k]) : fields[k]
    }
  }
  if (Object.keys(patch).length === 0) {
    throw new Error('Nothing to update')
  }

  // If only media_urls provided but not image_url, keep image_url synced with first item
  if ('media_urls' in patch && !('image_url' in patch)) {
    const arr = patch.media_urls
    patch.image_url = Array.isArray(arr) && arr.length ? arr[0] : null
  }

  const { data, error } = await withBackoff(() =>
    supabase
      .schema('omd')
      .from('pins')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
  )
  if (error) throw error
  return data
}

/**
 * Delete a pin (owner-only via RLS).
 */
export async function deleteDrop(id) {
  if (!id) throw new Error('Missing id')
  const { error } = await withBackoff(() =>
    supabase
      .schema('omd')
      .from('pins')
      .delete()
      .eq('id', id)
  )
  if (error) throw error
  return { ok: true }
}

/* --------------------------------- Votes (likes) ---------------------------------- */

export async function getVote(pinId, userId) {
  if (!pinId || !userId) return null
  try {
    const { data, error } = await withBackoff(() =>
      supabase
        .schema('omd')
        .from('pin_votes')
        .select('value')
        .eq('pin_id', pinId)
        .eq('user_id', userId)
        .maybeSingle()
    )
    if (error) throw error
    return data?.value ?? null
  } catch (e) {
    console.warn('[getVote]', e)
    return null
  }
}

export async function getVoteCounts(pinId) {
  if (!pinId) return { up: 0, down: 0 }
  try {
    const [{ count: upCount, error: upErr }, { count: downCount, error: downErr }] =
      await Promise.all([
        withBackoff(() =>
          supabase
            .schema('omd')
            .from('pin_votes')
            .select('*', { count: 'exact', head: true })
            .eq('pin_id', pinId)
            .eq('value', 1)
        ),
        withBackoff(() =>
          supabase
            .schema('omd')
            .from('pin_votes')
            .select('*', { count: 'exact', head: true })
            .eq('pin_id', pinId)
            .eq('value', -1)
        ),
      ])
    if (upErr) throw upErr
    if (downErr) throw downErr
    return { up: upCount ?? 0, down: downCount ?? 0 }
  } catch (e) {
    console.warn('[getVoteCounts]', e)
    return { up: 0, down: 0 }
  }
}

export async function setVote(pinId, value) {
  if (!pinId) throw new Error('Missing pinId')
  const { data: u } = await supabase.auth.getUser()
  const userId = u?.user?.id
  if (!userId) throw new Error('Not signed in')

  if (value === 0) {
    const { error } = await withBackoff(() =>
      supabase
        .schema('omd')
        .from('pin_votes')
        .delete()
        .eq('pin_id', pinId)
        .eq('user_id', userId)
    )
    if (error) throw error
    return
  }

  const { error } = await withBackoff(() =>
    supabase
      .schema('omd')
      .from('pin_votes')
      .upsert(
        { pin_id: pinId, user_id: userId, value },
        { onConflict: 'user_id,pin_id' }
      )
  )
  if (error) throw error
}

/* ----------------------------------- Views ---------------------------------------- */

/**
 * Record a view (idempotent server-side). Local throttle: once per pin per 12h.
 * Requires RPC: omd.record_pin_view(p_pin_id uuid, p_device_id text)
 */
export async function recordView(pinId) {
  if (!pinId) return
  try {
    const device_id = getDeviceId()
    // local throttle key
    const K = `omd.viewed.${pinId}`
    const now = Date.now()
    try {
      const last = Number(localStorage.getItem(K) || 0)
      if (now - last < 12 * 60 * 60 * 1000) return // already reported recently
    } catch {}
    await withBackoff(() =>
      supabase.rpc('record_pin_view', {
        p_pin_id: pinId,
        p_device_id: device_id,
      })
    )
    try { localStorage.setItem(K, String(now)) } catch {}
  } catch (e) {
    // swallow 429s; log others
    if (!(e?.status === 429 || /Too Many Requests/i.test(e?.message))) {
      console.warn('[recordView]', e?.message || e)
    }
  }
}

/**
 * Get total views for a pin (owner excluded server-side).
 * Requires RPC: omd.get_pin_view_count(p_pin_id uuid)
 */
export async function getViewCount(pinId) {
  if (!pinId) return 0
  if (_viewCountCache.has(pinId)) return _viewCountCache.get(pinId)
  try {
    const { data, error } = await withBackoff(() =>
      supabase.rpc('get_pin_view_count', { p_pin_id: pinId })
    )
    if (error) throw error
    const n = Number(data || 0)
    _viewCountCache.set(pinId, n)
    return n
  } catch (e) {
    console.warn('[getViewCount]', e?.message || e)
    return 0
  }
}

/* --------------------------- My Pins (with stats view) ----------------------------- */

/**
 * SQL view: omd.my_pins_list (pins + votes + views) filtered by user.
 * Columns expected by UI: id, note, image_url, media_urls, link_url, created_at,
 *                        view_count, up_count, down_count
 */
export async function fetchMyDropsWithStats({ userId }) {
  if (!userId) throw new Error('Missing userId')

  const { data, error } = await withBackoff(() =>
    supabase
      .schema('omd')
      .from('my_pins_list')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  )
  if (error) throw error
  return (data ?? []).map((r) => ({
    ...r,
    media_urls: coerceMediaUrls(r.media_urls),
  }))
}

/* ------------------------------ Top Posters ------------------------------ */
/**
 * SQL view required: omd.top_posters (user_id, pin_count, display_name, username, photo_url)
 */
export async function fetchTopPosters({ limit = 5 } = {}) {
  const { data, error } = await withBackoff(() =>
    supabase
      .schema('omd')
      .from('top_posters')
      .select('*')
      .order('pin_count', { ascending: false })
      .limit(limit)
  )
  if (error) throw error
  return data ?? []
}

/* ------------------------------ Compat wrapper --------------------------- */
/**
 * Compatibility shim so existing components can import:
 *   import { listDropsByProfile } from "../../rides/lib/drops.js";
 */
export async function listDropsByProfile(profileId, opts = {}) {
  if (!profileId) throw new Error('Missing profileId')
  return fetchMyDrops({ userId: profileId, ...opts })
}
