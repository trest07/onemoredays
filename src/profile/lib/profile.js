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
