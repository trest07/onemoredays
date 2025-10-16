/**
 * wdrop/lib/adapters.js
 * Lightweight mappers to bridge existing data (e.g., "drops") into the
 * trip/itinerary domain without changing your current tables.
 *
 * These helpers are pure and have no external imports.
 */

/**
 * Ensure a URL has an http/https scheme.
 * Returns the original value if empty/falsey.
 * @param {string|undefined|null} url
 * @returns {string|undefined|null}
 */
export function ensureHttpScheme(url) {
  if (!url) return url ?? null;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

/**
 * Map an existing "drop" object into a "trip stop" shape.
 * The result can be sent directly to your `trip_stops` insert,
 * except for the required `trip_id` which you should add separately.
 *
 * @param {Object} drop - Source drop from your rides feature.
 * @param {Object} [overrides] - Optional fields to override on the result.
 * @returns {{
 *  title: string,
 *  lat?: number,
 *  lng?: number,
 *  note?: string,
 *  place_ref?: string,
 *  media_url?: string|null,
 *  day_index?: number
 * }}
 */
export function dropToTripStop(drop, overrides = {}) {
  if (!drop || typeof drop !== "object") {
    throw new Error("dropToTripStop: invalid drop");
  }

  const title =
    drop.title?.trim() ||
    drop.name?.trim() ||
    (drop.address ? `Pinned: ${drop.address}` : "Pinned place");

  const lat = drop.lat ?? drop.latitude ?? undefined;
  const lng = drop.lng ?? drop.longitude ?? undefined;

  const media =
    drop.media_url ||
    drop.photo_url ||
    drop.image_url ||
    null;

  const base = {
    title,
    lat,
    lng,
    note: drop.description || drop.note || "",
    place_ref: `drop:${drop.id ?? drop.drop_id ?? "unknown"}`,
    media_url: media,
    day_index: overrides.day_index ?? 0,
  };

  return { ...base, ...overrides };
}

/**
 * Optional: map a stop back to a minimal UI marker shape for maps.
 * @param {Object} stop
 * @returns {{id: any, lat?: number, lng?: number, title: string}}
 */
export function stopToMarker(stop) {
  return {
    id: stop.id,
    lat: stop.lat ?? stop.latitude,
    lng: stop.lng ?? stop.longitude,
    title: stop.title || "Stop",
  };
}

/**
 * Optional: normalize a trip object into a compact card view model.
 * Useful if your TripCard expects consistent fields.
 * @param {Object} trip
 * @returns {{id:any,title:string,description?:string,start_date?:string,stops_count?:number,cover_url?:string}}
 */
export function tripToCardData(trip) {
  return {
    id: trip.id,
    title: trip.title || "Untitled trip",
    description: trip.description || "",
    start_date: trip.start_date || trip.starts_on || null,
    stops_count: trip.stops_count ?? trip._stops_count ?? 0,
    cover_url: trip.cover_url || null,
  };
}
