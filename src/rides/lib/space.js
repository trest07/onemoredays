// src/rides/lib/space.js
import { supabase } from '../../supabaseClient';

const SPACE_SLUG = 'onemoreday';

/**
 * Fetch the single global space (Phase 1).
 */
export async function getSpace() {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('slug', SPACE_SLUG)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Ensure the current authed user is a member of the global space.
 * Returns { space, isMember }
 */
export async function ensureMembership() {
  const {
    data: { session },
    error: sessErr,
  } = await supabase.auth.getSession();
  if (sessErr) throw sessErr;

  const space = await getSpace();

  if (!session?.user?.id) {
    // not signed in; viewer-only
    return { space, isMember: false };
  }

  const userId = session.user.id;

  // Check membership
  const { data: existing, error: readErr } = await supabase
    .from('space_members')
    .select('user_id')
    .eq('space_id', space.id)
    .eq('user_id', userId)
    .maybeSingle();
  if (readErr) throw readErr;

  if (existing) {
    return { space, isMember: true };
  }

  // Join
  const { error: insErr } = await supabase
    .from('space_members')
    .insert({ space_id: space.id, user_id: userId, role: 'member' });
  if (insErr) throw insErr;

  return { space, isMember: true };
}
