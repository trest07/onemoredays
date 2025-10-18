// src/rides/lib/trips.js
import { supabase } from "@/supabaseClient";

/** Trips API helpers (omd schema) */

export async function fetchTrips({
  limit = 50,
  offset = 0,
  userId = null,
  currentUserId = null,
} = {}) {
  if (!currentUserId) {
    const { data: currentUser } = await supabase.auth.getUser();
    currentUserId = currentUser?.user?.id || null;
  }

  let query = supabase
    .schema("omd")
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    if (userId === currentUserId) {
      query = query.eq("user_id", userId);
    } else {
      const { data: followData, error: followError } = await supabase
        .schema("omd")
        .from("follow_requests")
        .select("*")
        .eq("follower_id", currentUserId)
        .eq("followed_id", userId)
        .maybeSingle();

      if (followError && followError.code !== "PGRST116") {
        throw followError;
      }

      if (followData && followData?.status === "accepted") {
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("user_id", userId).eq("is_private", false);
      }
    }
  } else {
    query = query.eq("user_id", currentUserId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchTripById(id) {
  const { data, error } = await supabase
    .schema("omd")
    .from("trips")
    .select("*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function addTrip({
  user_id,
  title,
  description,
  start_date,
  end_date,
  is_private = false,
  image_url = null,
}) {
  const { data, error } = await supabase
    .schema("omd")
    .from("trips")
    .insert([
      {
        user_id,
        title,
        description,
        start_date,
        end_date,
        is_private,
        image_url,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrip(id, patch) {
  const { data, error } = await supabase
    .schema("omd")
    .from("trips")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTrip(id) {
  const { error } = await supabase
    .schema("omd")
    .from("trips")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

/* Stops */

export async function fetchStopsForTrip(tripId) {
  const { data, error } = await supabase
    .schema("omd")
    .from("stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_index", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addStop(stop) {
  // stop must contain trip_id, day_index, order_index, title...
  const { data, error } = await supabase
    .schema("omd")
    .from("stops")
    .insert([stop])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStop(id, patch) {
  const { data, error } = await supabase
    .schema("omd")
    .from("stops")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStop(id) {
  const { error } = await supabase
    .schema("omd")
    .from("stops")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
