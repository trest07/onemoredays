// src/auth/Register.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

const ACCENT = "#E45A12";
const BTN_GRADIENT = "linear-gradient(180deg, #E45A12 0%, #8E1E1E 100%)";

const apocalypticTextStyle = {
  background: BTN_GRADIENT,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  WebkitTextStrokeWidth: "0.4px",
  WebkitTextStrokeColor: "#111",
  paintOrder: "stroke fill",
  textShadow: "0 1px 1px rgba(0,0,0,0.35)",
};

// helpers (unchanged)
function slugify(s) {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "") || "user"
  );
}
function randDigits(n = 4) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
}
function calcAgeFromBirthdate(iso) {
  if (!iso) return null;
  const b = new Date(iso);
  if (Number.isNaN(+b)) return null;
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return Math.max(0, age);
}

const INPUT_CLS =
  "w-full h-14 text-[17px] rounded-xl border border-gray-300 px-4 outline-none " +
  "focus:ring-2 focus:ring-orange-600 bg-white";

export default function Register() {
  const nav = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [usernameBase, setUsernameBase] = React.useState("");
  const [birthdate, setBirthdate] = React.useState("");
  const [sex, setSex] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  const setDbError = (err) => {
    if (!err) return;
    const detail = err?.details || err?.hint || err?.message || String(err);
    setError(detail);
    console.warn("[DB ERROR]", err);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) {
      setLoading(false);
      setDbError(signUpErr);
      return;
    }

    const userId = data?.user?.id;
    if (userId) {
      const age = calcAgeFromBirthdate(birthdate);
      const is_adult = typeof age === "number" ? age >= 18 : null;
      const base = slugify(usernameBase || displayName || email.split("@")[0]);

      let finalUsername = `${base}${randDigits(4)}`;
      let attempts = 0;
      const maxAttempts = 4;
      let lastErr = null;

      while (attempts < maxAttempts) {
        const patch = {
          display_name: displayName?.trim() || null,
          username: finalUsername,
          birthdate: birthdate || null,
          age: age ?? null,
          is_adult: is_adult ?? null,
          sex: sex || null,
          updated_at: new Date().toISOString(),
        };

        // PROFILES keyed by auth user id (your schema)
        const { error: profErr } = await supabase
          .from("profiles")
          .update(patch)
          .eq("id", userId)
          .select();

        if (!profErr) { lastErr = null; break; }
        if (profErr.code === "23505") { // unique_violation (username)
          attempts++; finalUsername = `${base}${randDigits(4)}`; lastErr = profErr; continue;
        }
        lastErr = profErr; break;
      }

      if (lastErr) { setLoading(false); setDbError(lastErr); return; }

      setLoading(false);
      nav("/", { replace: true });
      return;
    }

    // fallback sign-in (shouldn’t be needed)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInErr) { setDone(true); return; }
    nav("/", { replace: true });
  };

  return (
    <div
      className="grid place-items-center px-4"
      style={{
        minHeight: "calc(100dvh - env(safe-area-inset-bottom) - 96px)",
        paddingTop: "calc(env(safe-area-inset-top) + 64px)",
      }}
    >
      <div className="relative w-full max-w-[720px]">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <div className="rounded-full border border-gray-200 bg-white/95 backdrop-blur px-5 py-2 shadow-md">
            <div className="text-[12px] uppercase tracking-wide text-gray-600 text-center">One More Day</div>
            <div className="text-[16px] font-semibold leading-tight text-center" style={apocalypticTextStyle}>
              Drop your moments. Map your vibez.
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 pt-12 shadow">
          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

          {done ? (
            <div className="text-sm text-gray-700">
              Account created. You can now sign in.
              <div className="mt-4">
                <Link to="/login" className="font-medium" style={{ color: ACCENT }}>
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Display name</label>
                <input type="text" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} className={INPUT_CLS} placeholder="e.g., Alex Rivera" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username <span className="text-gray-400">(we’ll add random numbers)</span></label>
                <input type="text" value={usernameBase} onChange={(e)=>setUsernameBase(e.target.value)} className={INPUT_CLS} placeholder="e.g., alex, alex-r" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Birthdate</label>
                  <input type="date" value={birthdate} onChange={(e)=>setBirthdate(e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sex</label>
                  <select value={sex} onChange={(e)=>setSex(e.target.value)} className={INPUT_CLS}>
                    <option value="">Select…</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className={INPUT_CLS} placeholder="you@example.com" autoComplete="email" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className={INPUT_CLS} placeholder="Minimum 6 characters" autoComplete="new-password" minLength={6} />
              </div>

              <button type="submit" disabled={loading} style={{ background: BTN_GRADIENT }} className="w-full h-14 rounded-xl text-white text-base font-semibold shadow-md transition disabled:opacity-60 hover:opacity-95">
                {loading ? "Creating…" : "Create Account"}
              </button>
            </form>
          )}

          <div className="mt-5 text-sm">
            Already have an account? <Link to="/login" className="font-medium" style={{ color: ACCENT }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
