// src/features/settings/AccountSettings.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"   // 👈 add
import { supabase } from "@/supabaseClient"
import Loading from "../../components/Loading"
import { useAuth } from "../../context/AuthContext"

export default function AccountSettings() {
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [err, setErr] = useState("")

  // email
  const [emailEditing, setEmailEditing] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [emailSaving, setEmailSaving] = useState(false)

  // password
  const [passEditing, setPassEditing] = useState(false)
  const [curPass, setCurPass] = useState("") // optional re-auth UX
  const [newPass, setNewPass] = useState("")
  const [newPass2, setNewPass2] = useState("")
  const [passSaving, setPassSaving] = useState(false)

  const navigate = useNavigate()               // 👈 add

  const { loggedUser } = useAuth();

  useEffect(() => {
    let on = true
    ;(async () => {
      try {
        // const { data, error } = await supabase.auth.getUser()
        const data = loggedUser
        if (!on) return
        setUser(data ?? null)
        setNewEmail(data.email ?? "")
      } catch (e) {
        setErr(e?.message || "Auth error")
      } finally {
        setLoadingUser(false)
      }
    })()
    return () => { on = false }
  }, [])

  async function onLogout() {
    setErr("")
    const { error } = await supabase.auth.signOut()
    if (error) {
      setErr(error.message)
      return
    }
    // ✅ redirect to your main page route
    try {
      navigate("/")                         // React Router navigation
    } catch {
      window.location.href = "/"            // hard fallback (PWA/Safari)
    }
  }

  async function onSaveEmail() {
    try {
      setErr("")
      setEmailSaving(true)
      if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
        throw new Error("Enter a valid email address")
      }
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/auth/confirm` }
      )
      if (error) throw error
      setEmailEditing(false)
      alert("If required, confirm the change from the verification email.")
    } catch (e) {
      setErr(e?.message || "Failed to update email")
    } finally {
      setEmailSaving(false)
    }
  }

  async function onSavePassword() {
    try {
      setErr("")
      setPassSaving(true)

      // optional re-auth UX
      if (curPass && user?.email) {
        const { error: reErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: curPass,
        })
        if (reErr) throw new Error("Current password is incorrect")
      }

      if (newPass.length < 8) throw new Error("Password must be at least 8 characters")
      if (newPass !== newPass2) throw new Error("Passwords do not match")

      const { error } = await supabase.auth.updateUser({ password: newPass })
      if (error) throw error

      setPassEditing(false)
      setCurPass(""); setNewPass(""); setNewPass2("")
      alert("Password updated.")
    } catch (e) {
      setErr(e?.message || "Failed to update password")
    } finally {
      setPassSaving(false)
    }
  }

  if (loadingUser) return <Loading />

  return (
    <div className="max-w-screen-sm mx-auto px-4 pb-28" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 110px)' }}>
      {err ? (
        <div className="mb-4 text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
          {err}
        </div>
      ) : null}

      {/* Session */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 mb-5">
        <h2 className="text-sm font-semibold text-neutral-800 mb-3">Session</h2>
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            <div className="font-medium text-neutral-800">Sign out</div>
            <div className="text-xs">Ends your current session</div>
          </div>
          <button
            className="px-3 py-2 rounded-lg border border-neutral-300 hover:bg-black/5"
            onClick={onLogout}
            type="button"
          >
            Log out
          </button>
        </div>
      </section>

      {/* Email */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-800">Change email</h2>
          {!emailEditing && (
            <button
              className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-black/5 text-sm"
              onClick={() => setEmailEditing(true)}
              type="button"
            >
              Edit
            </button>
          )}
        </div>

        {!emailEditing ? (
          <div className="text-sm text-neutral-700">{user?.email || "—"}</div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-neutral-600">New email</label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-black/5 text-sm"
                onClick={() => { setEmailEditing(false); setNewEmail(user?.email || "") }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm disabled:opacity-50"
                disabled={emailSaving}
                onClick={onSaveEmail}
                type="button"
              >
                {emailSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Password */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-800">Change password</h2>
          {!passEditing && (
            <button
              className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-black/5 text-sm"
              onClick={() => setPassEditing(true)}
              type="button"
            >
              Edit
            </button>
          )}
        </div>

        {!passEditing ? (
          <div className="text-sm text-neutral-700">••••••••</div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-neutral-600">Current password (optional)</label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300"
              value={curPass}
              onChange={(e) => setCurPass(e.target.value)}
              placeholder="Enter current password"
            />

            <label className="block text-xs font-medium text-neutral-600">New password</label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="At least 8 characters"
            />

            <label className="block text-xs font-medium text-neutral-600">Confirm new password</label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300"
              value={newPass2}
              onChange={(e) => setNewPass2(e.target.value)}
              placeholder="Repeat new password"
            />

            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-black/5 text-sm"
                onClick={() => { setPassEditing(false); setCurPass(""); setNewPass(""); setNewPass2("") }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm disabled:opacity-50"
                disabled={passSaving}
                onClick={onSavePassword}
                type="button"
              >
                {passSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-red-700 mb-2">Delete account</h2>
        <p className="text-xs text-red-700 mb-3">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="flex justify-end">
          <button
            className="px-3 py-2 rounded-lg bg-red-600 text-white"
            type="button"
            onClick={() => {
              if (confirm("Are you sure you want to permanently delete your account?")) {
                // TODO: call your Edge Function / server to cascade delete, then sign out
                alert("Delete account: wire this to your backend.");
              }
            }}
          >
            Delete…
          </button>
        </div>
      </section>
    </div>
  )
}
