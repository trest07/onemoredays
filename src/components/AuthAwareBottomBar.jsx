// src/components/AuthAwareBottomBar.jsx
import React from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/supabaseClient";

function AuthBar() {
  return (
    <div
      className="fixed inset-x-0 bottom-4 flex justify-center"
      style={{
        zIndex: 2147483647,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 4px)",
        pointerEvents: "none",
      }}
    >
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow"
        style={{ touchAction: "manipulation" }}
      >
        <span className="text-sm text-gray-700">Join to drop pins</span>
        <Link to="/login" className="px-3 py-1.5 rounded-xl border text-sm hover:bg-gray-50">
          Log in
        </Link>
        <Link
          to="/register"
          className="px-3 py-1.5 rounded-xl text-sm text-white"
          style={{ background: "linear-gradient(180deg,#E45A12 0%,#8E1E1E 100%)" }}
        >
          Register
        </Link>
      </div>
    </div>
  );
}

export default function AuthAwareBottomBar() {
  const [authed, setAuthed] = React.useState(false);
  const loc = useLocation();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) setAuthed(Boolean(data?.session));
      } catch {}
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setAuthed(Boolean(session));
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // Always render on map routes; we *switch* what we show based on auth.
  // If you want to hide *both* on certain pages (e.g. /login), add conditions here.
  const hideOn = ["/login", "/register", "/reset"];
  if (hideOn.some((p) => loc.pathname.startsWith(p))) {
    return null;
  }

  return createPortal(authed ? <BottomNav /> : <AuthBar />, document.body);
}
