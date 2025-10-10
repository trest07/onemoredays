// src/rides/components/PinComposer.jsx
import React, { useMemo, useRef, useEffect, useState } from "react";

export default function PinComposer({
  show,
  onClose,
  bottomOffset = 0,
  err,
  isAuthed,
  isMember,
  noteRef,
  note,
  setNote,
  onFileChange,        // backward-compat: first file
  onFilesChange,       // array of files (max 3)
  preview,             // string OR string[] (optional). We render local previews too.
  imageUrlOverride,    // (kept for future)
  setImageUrlOverride, // (kept for future)
  adding,
  onAdd,               // call with NO args
  onRefresh,
  linkUrl,
  setLinkUrl,
}) {
  if (!show) return null;

  // stop map from receiving gestures while modal is open
  const stopAll = (e) => e.stopPropagation();

  // local ref if caller doesn't pass one
  const localRef = useRef(null);
  const taRef = noteRef || localRef;

  // local previews if user just selected files here
  const [localPreviews, setLocalPreviews] = useState([]);
  useEffect(() => {
    return () => {
      // cleanup object URLs
      localPreviews.forEach((u) => {
        try { if (u?.startsWith("blob:")) URL.revokeObjectURL(u); } catch {}
      });
    };
  }, [localPreviews]);

  useEffect(() => {
    // focus textarea when opening
    if (show) {
      requestAnimationFrame(() => {
        try { taRef.current?.focus(); } catch {}
      });
    }
  }, [show, taRef]);

  function handleFilesSelected(fileList) {
    const files = Array.from(fileList || []).slice(0, 3);
    // backward compatibility
    onFileChange?.(files[0] || null);
    onFilesChange?.(files);

    // build local previews
    const urls = files.map((f) => URL.createObjectURL(f));
    setLocalPreviews((prev) => {
      // cleanup old
      prev.forEach((u) => { try { if (u?.startsWith("blob:")) URL.revokeObjectURL(u); } catch {} });
      return urls;
    });
  }

  // normalize preview prop to array if provided
  const externalPreviews = Array.isArray(preview) ? preview : (preview ? [preview] : []);
  const previewsToShow = externalPreviews.length ? externalPreviews : localPreviews;

  // --- quick tag helpers (single input UX) ---
  function hasTag(txt, tag) {
    if (!txt) return false;
    const t = tag.replace(/^#/, "").toLowerCase();
    return new RegExp(`(^|\\s)#${t}(\\b|$)`, "i").test(txt);
  }
  function addTag(txt, tag) {
    if (hasTag(txt, tag)) return txt;
    const needsSpace = txt && !/\s$/.test(txt);
    return `${txt || ""}${needsSpace ? " " : ""}${tag}`.trim() + " ";
  }
  function removeTag(txt, tag) {
    const t = tag.replace(/^#/, "");
    const re = new RegExp(`(^|\\s)#${t}(?=\\b)`, "gi");
    const cleaned = (txt || "").replace(re, (m, p1) => (p1 ? p1 : "")).replace(/\s{2,}/g, " ").trim();
    return cleaned.length ? cleaned + " " : "";
  }
  function onToggle(tag, checked) {
    setNote((prev) => (checked ? addTag(prev, tag) : removeTag(prev, tag)));
    requestAnimationFrame(() => {
      try {
        const el = taRef.current;
        if (el) {
          const pos = el.value.length;
          el.focus();
          el.setSelectionRange(pos, pos);
        }
      } catch {}
    });
  }

  const petOn   = useMemo(() => hasTag(note, "#petfriendly"), [note]);
  const restOn  = useMemo(() => hasTag(note, "#restroom"), [note]);
  const truckOn = useMemo(() => hasTag(note, "#truckstop") || hasTag(note, "#18wheeler"), [note]);
  const foodOn  = useMemo(() => hasTag(note, "#restaurant"), [note]);
  const parkOn  = useMemo(() => hasTag(note, "#publicpark"), [note]);
  const gasOn  = useMemo(() => hasTag(note, "#gasstation"), [note]);

  return (
    <div
      className="fixed inset-0 z-[1500]"
      onTouchStart={stopAll}
      onPointerDown={stopAll}
      onWheel={stopAll}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      {/* Sheet */}
      <div
        className="
          absolute inset-x-3 md:inset-x-0 md:mx-auto
          max-w-lg
          rounded-2xl bg-white shadow-xl border
          flex flex-col
        "
        style={{
          bottom: `calc(${bottomOffset}px + 12px)`,
          // keep it tall but not full-screen; let body scroll internally
          maxHeight: "min(78vh, 680px)",
        }}
        onClick={stopAll}
        onTouchStart={stopAll}
        onPointerDown={stopAll}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center">
          <div className="text-base font-medium">Create a Drop</div>
          <div className="ml-auto text-sm text-neutral-600">
            {isAuthed ? (isMember ? "Member" : "Guest") : "Sign in to drop"}
          </div>
          <button
            className="ml-3 text-sm px-3 py-1.5 rounded-lg hover:bg-black/5"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        {/* Body (scroll area) */}
        <div className="px-5 py-4 space-y-5 overflow-y-auto">
          {err ? (
            <div className="text-red-700 text-sm border border-red-200 rounded-lg p-3 bg-red-50">
              {err}
            </div>
          ) : null}

          {/* Note */}
          <section className="space-y-2">
            <label className="block text-sm font-medium">Note</label>
            <textarea
              ref={taRef}
              className="w-full resize-y rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
              rows={4}
              placeholder="Say something about this spot… add tags like #restroom #petfriendly #truckstop #restaurant #publicpark #gasstation"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ fontSize: 17, lineHeight: 1.55 }}
            />
          </section>

          <hr className="border-neutral-200" />

          {/* Quick tags */}
          <section className="space-y-3">
            <div className="text-sm font-medium">Quick tags</div>
            <div className="grid grid-cols-1 [@media(min-width:360px)]:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 text-[16px]">
                <input type="checkbox" className="h-5 w-5" checked={petOn} onChange={(e) => onToggle("#petfriendly", e.target.checked)} />
                <span>Pet Friendly</span>
              </label>
              <label className="flex items-center gap-3 text-[16px]">
                <input type="checkbox" className="h-5 w-5" checked={restOn} onChange={(e) => onToggle("#restroom", e.target.checked)} />
                <span>Restroom</span>
              </label>
              <label className="flex items-center gap-3 text-[16px]">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={truckOn}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setNote((prev) => {
                      let next = removeTag(prev, "#18wheeler");
                      return checked ? addTag(next, "#truckstop") : removeTag(next, "#truckstop");
                    });
                  }}
                />
                <span>Truck / 18-Wheeler Friendly</span>
              </label>
              <label className="flex items-center gap-3 text-[16px]">
                <input type="checkbox" className="h-5 w-5" checked={foodOn} onChange={(e) => onToggle("#restaurant", e.target.checked)} />
                <span>Restaurant</span>
              </label>
              <label className="flex items-center gap-3 text-[16px]">
                <input type="checkbox" className="h-5 w-5" checked={parkOn} onChange={(e) => onToggle("#publicpark", e.target.checked)} />
                <span>Public Park</span>
              </label>
              <label className="flex items-center gap-3 text-[16px]">
                <input type="checkbox" className="h-5 w-5" checked={gasOn} onChange={(e) => onToggle("#gasstation", e.target.checked)} />
                <span>Gas Station</span>
              </label>
            </div>
          </section>

          <hr className="border-neutral-200" />

          {/* Media upload (1–3 images) */}
          <section className="space-y-3">
            <div className="text-sm font-medium">Images <span className="text-neutral-500">(up to 3)</span></div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="text-[16px]"
              />
            </div>

            {/* Preview grid */}
            {previewsToShow?.length ? (
              <div className="grid grid-cols-3 gap-3">
                {previewsToShow.slice(0, 3).map((src, i) => (
                  <div key={i} className="border rounded-xl overflow-hidden aspect-square bg-neutral-50">
                    <img alt={`preview-${i}`} src={src} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <hr className="border-neutral-200" />

          {/* Link URL (optional) */}
          <section className="space-y-2">
            <label className="block text-sm font-medium">Link (optional)</label>
            <input
              type="url"
              className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              style={{ fontSize: 17, lineHeight: 1.45 }}
            />
          </section>
        </div>

        {/* Footer (sticky) */}
        <div
          className="px-5 py-4 border-t bg-white sticky bottom-0"
          style={{
            paddingBottom: `max(12px, env(safe-area-inset-bottom))`,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border text-[15px] hover:bg-black/5"
              onClick={onRefresh}
            >
              Refresh
            </button>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border text-[15px] hover:bg-black/5"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-black text-white text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={adding || !isAuthed}
                onClick={() => onAdd()}
              >
                {adding ? "Posting…" : "Drop Pin"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
