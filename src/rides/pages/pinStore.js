// Simple pin store that you can swap to Supabase later with the same API.
// Pin shape:
// {
//   id: string, lat: number, lng: number,
//   note: string, imageUrl?: string, ttlHours: number,
//   createdAt: number (ms)
// }

const KEY = "omd.pins.v1"

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function save(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr))
  window.dispatchEvent(new Event("omd:pins:changed"))
}

export function getPins({ includeExpired = false } = {}) {
  const now = Date.now()
  return load().filter((p) => {
    if (includeExpired) return true
    const expiresAt = p.createdAt + p.ttlHours * 3600 * 1000
    return expiresAt > now
  })
}

export function addPin(pin) {
  const list = load()
  const id = crypto.randomUUID()
  const createdAt = Date.now()
  const item = { id, createdAt, ...pin }
  save([item, ...list])
  return item
}

export function deletePin(id) {
  const list = load().filter((p) => p.id !== id)
  save(list)
}

export function onPinsChanged(cb) {
  const handler = () => cb(getPins())
  window.addEventListener("omd:pins:changed", handler)
  // Fire once on subscribe
  cb(getPins())
  return () => window.removeEventListener("omd:pins:changed", handler)
}

// Optional: “bridge” so your Leaflet map can share its current center
// without us modifying your existing map code. If you want, call this from
// your map component on move:
//   window.__omdSetMapCenter(lat, lng)
let _center = { lat: 0, lng: 0 }
export function getMapCenter() { return _center }
export function setMapCenter(lat, lng) { _center = { lat, lng } }

// Expose setters for your existing map (only if you choose to use them)
if (!window.__omdSetMapCenter) {
  window.__omdSetMapCenter = setMapCenter
}
