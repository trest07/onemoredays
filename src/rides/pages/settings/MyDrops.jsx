// src/rides/pages/settings/MyDrops.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import {
  fetchMyDropsWithStats, // ← stats view so the badges show
  updateDrop,
  deleteDrop,
} from "@/rides/lib/drops";
import RatingStars from "../../components/RatingStars";
import CommentsSection from "../../components/CommentsSection";

/* ---------- Small card (clean, fixed thumbnail) ---------- */
function Item({ d, onDelete, onEdit }) {
  const thumb =
    (Array.isArray(d.media_urls) && d.media_urls[0]) ||
    d.image_url ||
    "/placeholder.png";

  return (
    <div className="flex gap-3 p-3 border rounded-xl bg-white">
      {/* Fixed-size thumbnail */}
      <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0 border">
        <img
          src={thumb}
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Right column */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-900 truncate">
          {d.note || "(no note)"}
        </div>
        <div className="text-xs text-neutral-500 mt-0.5">
          {d.created_at ? new Date(d.created_at).toLocaleString() : ""}
        </div>

        {!!d.link_url && (
          <a
            href={d.link_url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-blue-600 hover:underline break-all"
          >
            {d.link_url}
          </a>
        )}

        {/* Buttons + stats row */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onEdit(d)}
            className="px-2 py-1 text-xs rounded-lg border text-neutral-700 hover:bg-gray-50"
            title="Edit drop"
            type="button"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(d.id)}
            className="px-2 py-1 text-xs rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
            title="Delete drop"
            type="button"
          >
            Delete
          </button>

          <div className="ml-auto flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white">
              👀 {d.view_count ?? 0}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white">
              👍 {d.up_count ?? 0}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white">
              👎 {d.down_count ?? 0}
            </span>
          </div>
        </div>

        <div className="flex justify-between">
          <div>{/* spacing */}</div>
          {/* Rating */}
          <RatingStars pinId={d.id} userId={d.user_id} />
        </div>

        {/* Comments */}
        <CommentsSection pinId={d.id} userId={d.user_id} />
      </div>
    </div>
  );
}

/* ---------- Tiny modal for editing the note ---------- */
function EditNoteModal({ open, initialNote = "", onClose, onSave, saving }) {
  const [val, setVal] = useState(initialNote || "");
  useEffect(() => {
    if (open) setVal(initialNote || "");
  }, [open, initialNote]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-lg p-4">
        <div className="flex items-center mb-2">
          <div className="font-semibold">Edit note</div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-neutral-500 hover:text-black"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <textarea
          rows={4}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Update your note…"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="px-3 h-10 rounded-lg border border-neutral-300"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 h-10 rounded-lg bg-black text-white disabled:opacity-50"
            onClick={() => onSave(val)}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function MyDrops() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // modal state
  const [editing, setEditing] = useState(null); // holds the drop object
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data: u, error } = await supabase.auth.getUser();
        if (error) throw error;
        const userId = u?.user?.id;
        if (!userId) {
          setRows([]);
          return;
        }
        const data = await fetchMyDropsWithStats({ userId });
        setRows(data ?? []);
      } catch (e) {
        setErr(e?.message || "Failed to load your drops");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onDelete(id) {
    if (!id) return;
    if (!confirm("Delete this drop? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      await deleteDrop(id);
      setRows((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      alert(e?.message || "Failed to delete");
    } finally {
      setDeletingId("");
    }
  }

  async function onSaveNote(noteText) {
    if (!editing) return;
    try {
      setSaving(true);
      const updated = await updateDrop(editing.id, { note: noteText || null });
      setRows((xs) =>
        xs.map((x) => (x.id === editing.id ? { ...x, ...updated } : x))
      );
      setEditing(null);
    } catch (e) {
      alert(e?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <div className="p-4 text-sm text-neutral-600">Loading…</div>;
  if (err) return <div className="p-4 text-sm text-red-600">{err}</div>;
  if (!rows.length)
    return (
      <div className="p-4 text-sm text-neutral-600">
        You haven’t posted any drops yet.
      </div>
    );

  return (
    <div className={deletingId ? "opacity-50" : ""}>
      <div className="max-w-2xl mx-auto space-y-3">
        {rows.map((d) => (
          <Item
            key={d.id}
            d={d}
            onEdit={(row) => setEditing(row)}
            onDelete={onDelete}
          />
        ))}
      </div>

      <EditNoteModal
        open={!!editing}
        initialNote={editing?.note ?? ""}
        onClose={() => setEditing(null)}
        onSave={onSaveNote}
        saving={saving}
      />
    </div>
  );
}
