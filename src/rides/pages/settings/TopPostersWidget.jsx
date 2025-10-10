// src/rides/pages/settings/TopPostersWidget.jsx
import React, { useEffect, useState } from "react";
import { fetchTopPosters } from "@/rides/lib/drops";

export default function TopPostersWidget({ limit = 5 }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => setRows(await fetchTopPosters({ limit })))();
  }, [limit]);

  if (!rows.length) return null;

  return (
    <div className="p-4">
      <div className="text-sm font-semibold mb-3">Top Posters</div>
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.user_id} className="flex items-center gap-3">
            <span className="w-6 text-right text-xs text-neutral-500">{i+1}.</span>
            <img src={r.photo_url || "/avatar.jpg"} alt="" className="w-7 h-7 rounded-full border" />
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">
                {r.display_name || r.username || r.user_id.slice(0,8)}
              </div>
              <div className="text-xs text-neutral-500 truncate">
                {r.username ? `@${r.username}` : ""}
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full border bg-white">🧷 {r.pin_count}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
