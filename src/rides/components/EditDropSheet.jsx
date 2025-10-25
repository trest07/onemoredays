// src/rides/components/EditDropSheet.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/supabaseClient";
import { compressImageFile, uploadToCloudflare } from "@/lib/uploadToCloudflare.js";
import { useAuth } from "../../context/AuthContext";

/** same key pattern as MapView composer */
function omdMediaKey({ userId = "anon", originalName = "upload.jpg" } = {}) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const ext = (originalName.match(/\.(\w{1,8})$/i)?.[1] || "jpg").toLowerCase();
  const rand = Math.random().toString(36).slice(2, 8);
  return `onemoreday/posts/${userId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`;
}

export default function EditDropSheet({ open, onClose, drop, onSave }) {
  const [note, setNote] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // media management like PinComposer
  const [files, setFiles] = useState([]);            // File[]
  const [mediaUrls, setMediaUrls] = useState([]);    // string[]
  const [imageUrlOverride, setImageUrlOverride] = useState(""); // paste-url quick add

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open || !drop) return;
    setNote(drop.note || "");
    setLinkUrl(drop.link_url || "");
    setIsPrivate(!!drop.is_private);
    const startUrls =
      (Array.isArray(drop.media_urls) && drop.media_urls.length ? drop.media_urls : []) ||
      (drop.image_url ? [drop.image_url] : []);
    setMediaUrls(startUrls.slice(0, 10));
    setFiles([]);
    setImageUrlOverride("");
  }, [open, drop]);

  const coverUrl = useMemo(
    () => (mediaUrls?.length ? mediaUrls[0] : (drop?.image_url || "")),
    [mediaUrls, drop]
  );

  if (!open || !drop) return null;

  const { loggedUser } = useAuth();
  async function handleUploadSelected() {
    if (!files?.length) return;
    // const { data: u } = await supabase.auth.getUser();
    const uid = loggedUser?.id || "anon";

    const out = [...mediaUrls];
    for (let i = 0; i < Math.min(files.length, 3 - out.length); i++) {
      const f = files[i];
      const compressed = await compressImageFile(f, 1280, 0.82);
      const key = omdMediaKey({ userId: uid, originalName: f.name });
      const { url, error } = await uploadToCloudflare(compressed, key);
      if (error) throw new Error(error);
      out.push(url);
    }
    setMediaUrls(out.slice(0, 10));
    setFiles([]);
    try { fileInputRef.current.value = ""; } catch {}
  }

  function addUrlFromOverride() {
    const u = (imageUrlOverride || "").trim();
    if (!u) return;
    const out = [...mediaUrls, u].slice(0, 10);
    setMediaUrls(out);
    setImageUrlOverride("");
  }

  function removeAt(idx) {
    const out = mediaUrls.slice();
    out.splice(idx, 1);
    setMediaUrls(out);
  }

  async function save() {
    try {
      setSaving(true);

      // Upload any newly selected files first (respect max 3 total)
      if (files.length) await handleUploadSelected();

      // After uploads, build patch
      const finalUrls = mediaUrls.slice(0, 10);
      const patch = {
        note: note?.trim() || null,
        link_url: linkUrl?.trim() || null,
        is_private: !!isPrivate,
        media_urls: finalUrls.length ? finalUrls : null,
        image_url: finalUrls.length ? finalUrls[0] : null, // keep cover synced
      };

      await onSave(patch);
      onClose?.();
    } catch (e) {
      alert(e?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[3000] bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-[560px] rounded-2xl bg-white border shadow-lg p-5">
        <div className="flex items-center mb-3">
          <div className="text-base font-semibold">Edit Drop</div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-neutral-500 hover:text-black"
            aria-label="Close"
          >
            ✕
          </button>
</div>

        {/* Cover preview (optional) */}
        {coverUrl ? (
          <div className="mb-3">
            <img
              src={coverUrl}
              alt="cover"
              className="w-full max-h-56 object-cover rounded-lg border"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : null}

        {/* Note */}
        <label className="block text-sm mb-3">
          <div className="mb-1 text-neutral-600">Note</div>
          <textarea
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {/* Link */}
        <label className="block text-sm mb-3">
          <div className="mb-1 text-neutral-600">Link (optional)</div>
          <input
            type="url"
            className="w-full h-10 px-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>

        {/* Privacy */}
        <label className="inline-flex items-center gap-2 text-sm mb-3">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Make this drop private
        </label>

        {/* Media controls */}
        <div className="mb-3">
          <div className="text-sm font-medium mb-1">Media</div>

          {/* Current media list with remove */}
          {!!mediaUrls.length && (
            <div className="flex flex-wrap gap-2 mb-2">
              {mediaUrls.map((u, i) => (
                <div key={i} className="relative">
                  <img
                    src={u}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover border"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border grid place-items-center text-xs"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add via URL */}
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={imageUrlOverride}
              onChange={(e) => setImageUrlOverride(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Paste media URL (image/video)…"
            />
            <button
              type="button"
              onClick={addUrlFromOverride}
              className="px-3 h-10 rounded-lg border"
            >
              Add URL
            </button>
          </div>

          {/* Upload files (up to 3 total) */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => {
                const arr = Array.from(e.target.files || []);
                setFiles(arr.slice(0, Math.max(0, 3 - mediaUrls.length)));
              }}
            />
            {!!files.length && (
              <span className="text-xs text-neutral-600">
                {files.length} file(s) ready to upload
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            className="px-4 h-10 rounded-lg border border-neutral-300"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 h-10 rounded-lg bg-black text-white"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
