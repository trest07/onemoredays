// src/lib/follows.js
import { supabase } from "@/supabaseClient";

/** Send a follow request (follower = current user) */
export async function sendFollowRequest(targetId) {
  const { data: me } = await supabase.auth.getUser();
  const follower = me?.user?.id;
  if (!follower) throw new Error("Not authenticated");

  const { error } = await supabase
    .schema("omd")
    .from("follow_requests")
    .insert({ follower_id: follower, followed_id: targetId, status: 'pending' });

  if (error) throw error;
  return true;
}

/** Cancel outgoing request or unfollow (follower cancels) */
export async function cancelFollow(targetId) {
  const { data: me } = await supabase.auth.getUser();
  const follower = me?.user?.id;
  if (!follower) throw new Error("Not authenticated");

  const { error } = await supabase
    .schema("omd")
    .from("follow_requests")
    .delete()
    .eq("follower_id", follower)
    .eq("followed_id", targetId);

  if (error) throw error;
  return true;
}

/** Accept a pending request (only the followed user can call) */
export async function acceptFollowRequest(followerId) {
  const { data: me } = await supabase.auth.getUser();
  const followed = me?.user?.id;
  if (!followed) throw new Error("Not authenticated");

  const { error } = await supabase
    .schema("omd")
    .from("follow_requests")
    .update({ status: 'accepted' })
    .eq("follower_id", followerId)
    .eq("followed_id", followed);

  if (error) throw error;
  return true;
}

/** Reject a pending request (only the followed user can call) */
export async function rejectFollowRequest(followerId) {
  const { data: me } = await supabase.auth.getUser();
  const followed = me?.user?.id;
  if (!followed) throw new Error("Not authenticated");

  const { error } = await supabase
    .schema("omd")
    .from("follow_requests")
    .update({ status: 'rejected' })
    .eq("follower_id", followerId)
    .eq("followed_id", followed);

  if (error) throw error;
  return true;
}

/** Get incoming pending requests for the current user */
export async function getIncomingRequests() {
  const { data: me } = await supabase.auth.getUser();
  const followed = me?.user?.id;
  if (!followed) return [];

  const { data, error } = await supabase
    .schema("omd")
    .from("follow_requests")
    .select("follower_id, created_at")
    .eq("followed_id", followed)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Get pending outgoing requests (current user) */
export async function getOutgoingRequests() {
  const { data: me } = await supabase.auth.getUser();
  const follower = me?.user?.id;
  if (!follower) return [];

  const { data, error } = await supabase
    .schema("omd")
    .from("follow_requests")
    .select("followed_id, created_at")
    .eq("follower_id", follower)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Get followers (accepted) for a given userId */
export async function getFollowers(userId) {
  const { data, error } = await supabase
    .schema("omd")
    .from("follow_requests")
    .select("follower_id, created_at")
    .eq("followed_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Get following list for a given userId */
export async function getFollowing(userId) {
  const { data, error } = await supabase
    .schema("omd")
    .from("follow_requests")
    .select("followed_id, created_at")
    .eq("follower_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Check relationship state between current user and target */
export async function getRelationship(targetId) {
  const { data: me } = await supabase.auth.getUser();
  const meId = me?.user?.id;
  if (!meId) return { status: null };

  const { data, error } = await supabase
    .schema("omd")
    .from("follow_requests")
    .select("status")
    .or(`(follower_id.eq.${meId},followed_id.eq.${meId})`)
    .eq("follower_id", meId)
    .eq("followed_id", targetId)
    .single();

  // fallback: do a direct select if above is too strict
  const { data: direct, error: directErr } = await supabase
    .schema("omd")
    .from("follow_requests")
    .select("status")
    .eq("follower_id", meId)
    .eq("followed_id", targetId)
    .single();

  if (directErr && !direct) return { status: null };
  return { status: direct?.status ?? data?.status ?? null };
}

/** Realtime subscription to follow events (optional) */
export function subscribeFollowEvents(handler) {
  // subscribes to Postgres NOTIFY channel 'omd_follow_events' if used in SQL function
  // Note: this requires you to create a server-side trigger that NOTIFYs. Alternatively, subscribe to table changes:
  return supabase
    .channel('omd-follow-chan')
    .on('postgres_changes', { event: '*', schema: 'omd', table: 'follow_requests' }, (payload) => {
      handler(payload);
    })
    .subscribe();
}
