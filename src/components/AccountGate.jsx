import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Usage:
 * <AccountGate fallback={<SignInPrompt />}>
 *   <ProtectedControls />
 * </AccountGate>
 */
export default function AccountGate({ children, fallback = null }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data?.session ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (!ready) return null; // avoid flicker

  return session ? children : fallback;
}

/** Small default prompt you can reuse if you want */
export function SignInPrompt() {
  return (
    <div className="text-sm p-3 rounded-xl border bg-white/90 shadow">
      <div className="font-semibold mb-1">Sign in to drop pins</div>
      <div className="opacity-80">
        You can still view the map without an account.
      </div>
      <div className="mt-2 flex gap-2">
        <a href="/login" className="px-3 py-1 rounded-lg border">Log in</a>
        <a href="/register" className="px-3 py-1 rounded-lg border">Create account</a>
      </div>
    </div>
  );
}
