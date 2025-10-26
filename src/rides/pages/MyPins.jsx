// src/rides/pages/MyPins.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import { fetchMyDrops, updateDrop, deleteDrop } from "@/rides/lib/drops";
import Loading from "../../components/Loading";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";

export default function MyPins() {
  const [userId, setUserId] = useState(null);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState({}); // id -> { note, link_url, is_private, lat, lng }
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { showConfirm } = useAlert();

  // Load current user
  const { loggedUser } = useAuth();
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // const { data } = await supabase.auth.getUser()
        if (!mounted) return;
        setUserId(loggedUser?.id ?? null);
      } catch (e) {
        setErr(e?.message ?? "Auth error");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const load = async () => {
    if (!userId) return;
    // setLoading(true)
    setErr("");
    try {
      const rows = await fetchMyDrops({ userId });
      setPins(rows);
      // seed editing state with current values
      const map = {};
      for (const p of rows) {
        map[p.id] = {
          note: p.note ?? "",
          link_url: p.link_url ?? "",
          is_private: !!p.is_private,
          lat: p.lat,
          lng: p.lng,
        };
      }
      setEditing(map);
    } catch (e) {
      setErr(e?.message ?? "Failed to load pins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const onChange = (id, key, value) => {
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const onSave = async (id) => {
    const patch = editing[id];
    if (!patch) return;
    setSavingId(id);
    setErr("");
    try {
      await updateDrop(id, {
        note: patch.note?.trim() || null,
        link_url: patch.link_url?.trim() || null,
        is_private: !!patch.is_private,
        lat: typeof patch.lat === "number" ? patch.lat : undefined,
        lng: typeof patch.lng === "number" ? patch.lng : undefined,
      });
      await load();
    } catch (e) {
      setErr(e?.message ?? "Failed to update pin");
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (id) => {
    if (!id) return;
    // if (!confirm('Delete this pin?')) return

    showConfirm({
      message: "Delete this pin?",
      onConfirm: async () => {
        setDeletingId(id);
        setErr("");
        try {
          await deleteDrop(id);
          await load();
        } catch (e) {
          setErr(e?.message ?? "Failed to delete pin");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const isEmpty = useMemo(() => !loading && pins.length === 0, [loading, pins]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My Pins</h1>
        <button
          className="text-sm px-3 py-1.5 rounded border hover:bg-black/5"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div className="mb-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded px-3 py-2">
          {err}
        </div>
      ) : null}

      {loading ? (
        <Loading />
      ) : isEmpty ? (
        <div className="text-sm opacity-70">
          You haven’t created any pins yet.
        </div>
      ) : (
        <div className="space-y-4">
          {pins.map((p) => {
            const edit = editing[p.id] || {};
            const isSaving = savingId === p.id;
            const isDeleting = deletingId === p.id;
            return (
              <div key={p.id} className="border rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs opacity-60">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-xs px-2 py-1 rounded border hover:bg-black/5 disabled:opacity-50"
                      onClick={() => onSave(p.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      onClick={() => onDelete(p.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">Note</label>
                    <textarea
                      className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      rows={3}
                      value={edit.note ?? ""}
                      onChange={(e) => onChange(p.id, "note", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs mb-1">Link URL</label>
                    <input
                      type="url"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      placeholder="https://example.com"
                      value={edit.link_url ?? ""}
                      onChange={(e) =>
                        onChange(p.id, "link_url", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id={`priv-${p.id}`}
                      type="checkbox"
                      checked={!!edit.is_private}
                      onChange={(e) =>
                        onChange(p.id, "is_private", e.target.checked)
                      }
                    />
                    <label htmlFor={`priv-${p.id}`} className="text-sm">
                      Private
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">Lat</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={edit.lat ?? p.lat}
                        onChange={(e) =>
                          onChange(p.id, "lat", parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Lng</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={edit.lng ?? p.lng}
                        onChange={(e) =>
                          onChange(p.id, "lng", parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>

                {p.image_url ? (
                  <div className="mt-3">
                    <img
                      src={p.image_url}
                      alt=""
                      className="max-h-48 rounded-lg object-cover"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
