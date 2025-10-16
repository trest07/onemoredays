// wdrop/lib/trips.js
// Supabase CRUD for trips and stops + light shaping for UI.

import { supabase } from "../../supabaseClient";
import { groupStopsByDay } from "./itinerary";

/**
 * Create a new trip.
 * @param {Object} payload
 * @param {string} payload.owner_id - profiles.id of the owner (required)
 * @param {string} payload.title
 * @param {string} [payload.description]
 * @param {string} [payload.start_date] - ISO date (YYYY-MM-DD)
 * @param {string} [payload.end_date] - ISO date (YYYY-MM-DD)
 * @param {"public"|"unlisted"|"private"} [payload.visibility="public"]
 * @param {string} [payload.cover_url]
 * @returns {Promise<Object>} inserted trip row
 */
export async function createTrip({
  owner_id,
  title,
  description = null,
  start_date = null,
  end_date = null,
  visibility = "public",
  cover_url = null,
}) {
  if (!owner_id) throw new Error("createTrip: owner_id is required");
  if (!title?.trim()) throw new Error("createTrip: title is required");

  const insert = {
    owner_id,
    title: title.trim(),
    description,
    start_date,
    end_date,
    visibility,
    cover_url,
  };

  const { data, error } = await supabase
    .from("trips")
    .insert([insert])
    .select("*")
    .single();

  if (error) throw new Error(error.message || "Failed to create trip");
  return data;
}

/**
 * Update a trip (owner-only via RLS).
 * @param {string} id
 * @param {Object} patch
 * @returns {Promise<Object>} updated row
 */
export async function updateTrip(id, patch) {
  if (!id) throw new Error("updateTrip: id is required");
  const { data, error } = await supabase
    .from("trips")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message || "Failed to update trip");
  return data;
}

/**
 * Soft delete: actually delete (RLS must allow owner).
 * @param {string} id
 */
export async function deleteTrip(id) {
  if (!id) throw new Error("deleteTrip: id is required");
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete trip");
}

/**
 * Get one trip by id and include grouped stops as `days`.
 * @param {string} id
 * @returns {Promise<Object>} { ...trip, days: [{day_index,stops:[]}, ...] }
 */
export async function getTripById(id) {
  if (!id) throw new Error("getTripById: id is required");

  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message || "Failed to load trip");

  // Load stops and group them
  const stops = await listStops(id);
  const days = groupStopsByDay(stops);

  return { ...trip, days };
}

/**
 * List trips for a given profile (owner).
 * @param {string} owner_id
 * @returns {Promise<Array>}
 */
export async function listTripsByProfile(owner_id) {
  if (!owner_id) throw new Error("listTripsByProfile: owner_id is required");
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("owner_id", owner_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Failed to load trips");
  return data ?? [];
}

/**
 * Add a stop to a trip (owner-only via RLS).
 * @param {Object} payload
 * @param {string} payload.trip_id (required)
 * @param {number} [payload.day_index=0]
 * @param {string} payload.title (required)
 * @param {number} [payload.lat]
 * @param {number} [payload.lng]
 * @param {string} [payload.note]
 * @param {string} [payload.place_ref] - e.g., "drop:abc123"
 * @param {string|null} [payload.media_url]
 * @param {number} [payload.order_index=0] - order within the day
 * @param {string} [payload.time] - optional time label like "10:00"
 * @returns {Promise<Object>} inserted stop row
 */
export async function addStop({
  trip_id,
  day_index = 0,
  title,
  lat,
  lng,
  note,
  place_ref,
  media_url,
  order_index = 0,
  time,
}) {
  if (!trip_id) throw new Error("addStop: trip_id is required");
  if (!title?.trim()) throw new Error("addStop: title is required");

  const insert = {
    trip_id,
    day_index,
    title: title.trim(),
    lat: lat ?? null,
    lng: lng ?? null,
    note: note ?? null,
    place_ref: place_ref ?? null,
    media_url: media_url ?? null,
    order_index,
    time: time ?? null,
  };

  const { data, error } = await supabase
    .from("trip_stops")
    .insert([insert])
    .select("*")
    .single();

  if (error) throw new Error(error.message || "Failed to add stop");
  return data;
}

/**
 * Update a stop (owner-only via RLS).
 * @param {string} id
 * @param {Object} patch
 * @returns {Promise<Object>}
 */
export async function updateStop(id, patch) {
  if (!id) throw new Error("updateStop: id is required");
  const { data, error } = await supabase
    .from("trip_stops")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message || "Failed to update stop");
  return data;
}

/**
 * Delete a stop (owner-only via RLS).
 * @param {string} id
 */
export async function deleteStop(id) {
  if (!id) throw new Error("deleteStop: id is required");
  const { error } = await supabase.from("trip_stops").delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete stop");
}

/**
 * List stops for a given trip, ordered by day and order_index.
 * @param {string} trip_id
 * @returns {Promise<Array>}
 */
export async function listStops(trip_id) {
  if (!trip_id) throw new Error("listStops: trip_id is required");
  const { data, error } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", trip_id)
    .order("day_index", { ascending: true })
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message || "Failed to load stops");
  return data ?? [];
}

/**
 * Convenience: set visibility on a trip.
 * @param {string} id
 * @param {"public"|"unlisted"|"private"} visibility
 */
export async function setTripVisibility(id, visibility) {
  return updateTrip(id, { visibility });
}

/**
 * Get current user id from Supabase auth (optional helper).
 * @returns {Promise<string|null>}
 */
export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user?.id ?? null;
}
