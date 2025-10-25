import React, { useState } from "react";
import { updateStop, deleteStop } from "@/trips/lib/trips";

export default function ItineraryDay({
  dayIndex,
  stops = [],
  refreshStops,
  onAddStop,
}) {
  const [editingId, setEditingId] = useState(null);
  const [text, setText] = useState("");

  async function handleSave(stop) {
    await updateStop(stop.id, { title: text || stop.title });
    setEditingId(null);
    refreshStops();
  }

  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-amber-600">Day {dayIndex + 1}</h4>
        <div className="text-xs text-neutral-500">
          {stops.length} stop{stops.length > 1 ? "s" : ""}
        </div>
        {onAddStop && (
          <button
            onClick={onAddStop}
            className="text-xs px-2 py-1 rounded-lg border border-dashed text-amber-600 hover:bg-amber-50 transition"
          >
            Add Stop
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {stops.map((s) => (
          <div key={s.id} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 shadow-sm">
            <div className="flex-1">
              {editingId === s.id ? (
                <>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm focus:outline-amber-400"
                  />
                  {}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleSave(s)}
                      className="px-2 py-1 bg-amber-500 text-white rounded text-xs hover:bg-amber-600 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                      }}
                      className="px-2 py-1 rounded text-xs border hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-gray-800">
                    {s.title || "Untitled stop"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.notes}</div>
                </>
              )}
            </div>
            {onAddStop && (
              <div className="flex gap-1 flex-col gap-1">
                <button
                  onClick={() => {
                    setEditingId(s.id);
                    setText(s.title || "");
                  }}
                  className="text-xs px-2 py-1 rounded border hover:bg-gray-100 transition"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Delete stop?")) {
                      await deleteStop(s.id);
                      refreshStops();
                    }
                  }}
                  className="text-xs px-2 py-1 rounded border text-red-600 hover:bg-red-50 transition"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="pt-2"></div>
      </div>
    </div>
  );
}
