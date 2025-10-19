import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../lib/profile.js";

/**
 * EditProfile.jsx
 * - Private page for the signed-in user to edit their basic profile fields.
 * - No changes to existing files required.
 */
export default function EditProfile() {
  const [initial, setInitial] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMyProfile();
        if (mounted) setInitial(me);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load profile");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const f = new FormData(e.currentTarget);

    // normalize website input (optional)
    let website = f.get("website")?.trim();
    if (website && !/^https?:\/\//i.test(website)) {
      website = `https://${website}`;
    }

    const patch = {
      display_name: f.get("display_name")?.trim() || null,
      bio: f.get("bio")?.trim() || null,
      website: website || null,
      location: f.get("location")?.trim() || null,
    };

    setSaving(true);
    try {
      await updateMyProfile(patch);
      setSaved(true);
      // refresh local state
      const me = await getMyProfile();
      setInitial(me);
      // optionally: window.history.back()
    } catch (e) {
      setError(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (error && !initial) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!initial) {
    return <div className="p-4">Loading…</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Edit profile</h1>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1">Display name</label>
          <input
            name="display_name"
            defaultValue={initial.display_name || ""}
            className="w-full border rounded p-2"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            name="bio"
            defaultValue={initial.bio || ""}
            className="w-full border rounded p-2"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              name="website"
              defaultValue={initial.website || ""}
              className="w-full border rounded p-2"
              inputMode="url"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              name="location"
              defaultValue={initial.location || ""}
              className="w-full border rounded p-2"
              autoComplete="address-level2"
            />
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {saved && <div className="text-green-600 text-sm">Saved.</div>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded border"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
