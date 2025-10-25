import { supabase } from "@/supabaseClient";

// Fetch a user's public profile
export async function getProfile(username) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, photo_url, bio, created_at")
    .eq("username", username)
    .single();

  if (error) throw error;
  return data;
}

// Fetch user's visible photos
export async function getUserPhotos(userId) {
  const { data, error } = await supabase
    .schema("omd")
    .from("profile_photos")
    .select("id, url, is_private, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Follow / Unfollow logic
export async function toggleFollow(targetId, currentUserId) {
  const { data: existing } = await supabase
    .schema("omd")
    .from("follows")
    .select("*")
    .eq("follower_id", currentUserId)
    .eq("followed_id", targetId)
    .single();

  if (existing) {
    await supabase
      .schema("omd")
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("followed_id", targetId);
    return { following: false };
  } else {
    await supabase
      .schema("omd")
      .from("follows")
      .insert({ follower_id: currentUserId, followed_id: targetId });
    return { following: true };
  }
}
// ----------------------------
// 👇 ADD THIS AT THE BOTTOM 👇
// ----------------------------

// Resolve :id that could be a UUID or a username (with/without "@")
export async function getProfileById(idOrUsername) {
  const key = String(idOrUsername || "")
    .trim()
    .replace(/^@/, "");

  // 1) Try by UUID
  let { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, photo_url, bio, created_at")
    .eq("id", key)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    // 2) Fallback to username
    const byUsername = await supabase
      .from("profiles")
      .select("id, display_name, username, photo_url, bio, created_at")
      .eq("username", key)
      .maybeSingle();

    if (byUsername.error) throw byUsername.error;
    data = byUsername.data || null;
  }

  const counts = await fetchProfileStatsClient(data.id);
  data = { ...data, ...counts };

  return data;
}

export async function fetchProfileStatsClient(userId) {
  const [
    { count: followers },
    { count: following },
    { count: drops },
    { count: trips },
  ] = await Promise.all([
    supabase
      .schema("omd")
      .from("follow_requests")
      .select("*", { count: "exact", head: true })
      .eq("followed_id", userId)
      .eq("status", "accepted"),
    supabase
      .schema("omd")
      .from("follow_requests")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId)
      .eq("status", "accepted"),
    supabase
      .schema("omd")
      .from("my_pins_list")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .schema("omd")
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    followers_count: followers ?? 0,
    following_count: following ?? 0,
    drops_count: drops ?? 0,
    trips_count: trips ?? 0,
  };
}

// Current user's profile (creates a minimal row if missing)
export async function getMyProfile() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return null;

  // Try existing row
  let { data: rows, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, photo_url, bio, created_at")
    .eq("id", user.id)
    .limit(1);

  if (error) throw error;
  if (rows && rows.length) return rows[0];

  // Create minimal profile if none exists
  const username = (user.email?.split("@")[0] || user.id.slice(0, 8)).replace(
    /[^a-z0-9_]/gi,
    ""
  );

  const insert = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username,
      display_name: "",
      bio: "",
      photo_url: "/avatar.jpg",
      discoverable: false,
    })
    .select("id, display_name, username, photo_url, bio, created_at")
    .single();

  if (insert.error) throw insert.error;
  return insert.data;
}
