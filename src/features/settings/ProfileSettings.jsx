// src/features/settings/ProfileSettings.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/supabaseClient";
import {
  compressImageFile,
  uploadToCloudflare,
} from "@/lib/uploadToCloudflare";
import Loading from "../../components/Loading";

function profileImageKey(userId = "anon", originalName = "avatar.jpg") {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const ext = (originalName.match(/\.(\w{1,8})$/i)?.[1] || "jpg").toLowerCase();
  const rand = Math.random().toString(36).slice(2, 8);
  return `profiles/${userId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`;
}

export default function ProfileSettings() {
  const [uid, setUid] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("/avatar.jpg");
  const [saving, setSaving] = useState(false);

  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data: userData, error: userErr } =
          await supabase.auth.getUser();
        if (userErr) throw userErr;
        const user = userData?.user;
        if (!on) return;
        setUid(user?.id ?? null);
        setEmail(user?.email ?? "");

        if (user?.id) {
          const { data: rows, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .limit(1);
          if (error) throw error;
          const p = rows?.[0];
          if (p) {
            setUsername(p.username ?? "");
            setDisplayName(p.display_name ?? "");
            setBio(p.bio ?? "");
            setPhotoUrl(p.photo_url ?? "/avatar.jpg");
          } else {
            await supabase.from("profiles").insert({
              id: user.id,
              username: user.email?.split("@")[0] || null,
              display_name: "",
              bio: "",
              photo_url: "/avatar.jpg",

              discoverable: false,
            });
          }
        }
      } catch (e) {
        setErr(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  function onChooseFile(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
  }

  function onRemovePhoto() {
    setFile(null);
    setPhotoUrl("/avatar.jpg");
  }

  async function onSave() {
    if (!uid) return;
    try {
      setErr("");
      setSaving(true);

      let nextPhotoUrl = photoUrl;
      if (file) {
        const compressed = await compressImageFile(file, 512, 0.82);
        const key = profileImageKey(uid, file.name);
        const { url, error } = await uploadToCloudflare(compressed, key);
        if (error) throw new Error(error);
        if (!url) throw new Error("Upload returned no URL");
        nextPhotoUrl = url;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || "",
          bio: bio || "",
          photo_url: nextPhotoUrl || "/avatar.jpg",
          updated_at: new Date().toISOString(),
        })
        .eq("id", uid);

      if (error) throw error;

      setPhotoUrl(nextPhotoUrl);
      setFile(null);
      alert("Profile saved.");
    } catch (e) {
      setErr(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div
      className="max-w-screen-sm mx-auto px-4 pb-28"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 110px)" }}
    >
      {err ? (
        <div className="mb-4 text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
          {err}
        </div>
      ) : null}

      {/* Profile card */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 mb-5">
        <h2 className="text-sm font-semibold text-neutral-800 mb-4">Profile</h2>

        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-5">
          <img
            src={previewUrl || photoUrl || "/avatar.jpg"}
            alt="profile"
            className="w-14 h-14 rounded-full object-cover border border-neutral-200"
          />
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onChooseFile}
            />
            <button
              className="px-3 py-2 rounded-lg border border-neutral-300 hover:bg-black/5"
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              Choose image
            </button>
            <button
              className="px-3 py-2 rounded-lg border border-neutral-300 hover:bg-black/5"
              onClick={onRemovePhoto}
              type="button"
            >
              Remove
            </button>
          </div>
          <div className="text-xs text-neutral-500">PNG/JPG up to ~5MB</div>
        </div>

        {/* Username (locked) */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Username
          </label>
          <div className="relative">
            <input
              value={username ? `@${username}` : ""}
              disabled
              className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-300 bg-neutral-100 text-neutral-700"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
              🔒
            </div>
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Usernames are permanent and can’t be changed.
          </div>
        </div>

        {/* Display name */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Display name
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            className="w-full px-3 py-2 rounded-lg border border-neutral-300"
          />
        </div>

        {/* Email (readonly) */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Email
          </label>
          <input
            value={email || ""}
            disabled
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-neutral-100 text-neutral-700"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a bit about you…"
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300"
          />
        </div>
      </section>

      {/* Sticky Save */}
      <div className="sticky bottom-[110px] flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-medium shadow-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
