// src/auth/Login.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

const ACCENT = "#E45A12";
const BTN_GRADIENT = "linear-gradient(180deg, #E45A12 0%, #8E1E1E 100%)";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    navigate("/");
  }

  return (
    // Center perfectly in the **visible** viewport (no extra top/bottom padding)
    <div
      className="grid place-items-center px-4"
      style={{
        height: "100svh",           // iOS-friendly viewport (no browser chrome inflation)
        padding: 0,                 // no extra white space
        margin: 0,
      }}
    >
      <div className="w-full max-w-[440px]">
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-7">
          {/* Brand header INSIDE the card so it doesn't add outer spacing */}
          <div className="mb-5 text-center">
            <div className="text-[12px] uppercase tracking-[0.18em] text-gray-500 font-semibold">
              ONE MORE DAY
            </div>
            <div
              className="mt-1 text-[19px] sm:text-[21px] font-semibold leading-tight"
              style={{
                background: BTN_GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Drop your moments. Map your vibez.
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              role="alert"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5">
                <path
                  d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  stroke="currentColor" strokeWidth="2"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 sm:h-13 text-[16px] sm:text-[17px] rounded-xl border border-gray-300 bg-white px-4 outline-none
                           focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-xs text-gray-600 hover:text-gray-800"
                  aria-pressed={showPw}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 sm:h-13 text-[16px] sm:text-[17px] rounded-xl border border-gray-300 bg-white px-4 pr-12 outline-none
                             focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                  placeholder="••••••••"
                />
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: BTN_GRADIENT }}
              className="w-full h-12 sm:h-13 rounded-xl text-white text-base font-semibold shadow-md transition
                         disabled:opacity-60 hover:opacity-95 active:translate-y-[1px]"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link to="/reset" className="hover:underline" style={{ color: ACCENT }}>
              Forgot password?
            </Link>
            <Link to="/register" className="hover:underline" style={{ color: ACCENT }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
