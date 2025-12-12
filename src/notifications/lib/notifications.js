import { supabase } from "@/supabaseClient";

// Fetch unread notifications count
export async function getUnreadCount(userId) {
  if (!userId) return 0;
  const { count, error } = await supabase
      .schema("omd")
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient", userId)
    .eq("is_read", false);
  if (error) throw error;
  return count || 0;
}

// Fetch all notifications (latest first)
export async function getUserNotifications(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
      .schema("omd")
    .from("notifications")
    .select("*")
    .eq("recipient", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Mark all as read
export async function markNotificationsRead(userId) {
  if (!userId) return;
  const { error } = await supabase
    .schema("omd")
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient", userId)
    .eq("is_read", false);
  if (error) throw error;
}
