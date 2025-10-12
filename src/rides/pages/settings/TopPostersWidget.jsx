import React, { useEffect, useState } from "react";
import { fetchTopPosters } from "@/rides/lib/drops";
import InlineProfileCard from "../../components/InlineProfileCard";

export default function TopPostersWidget({ limit = 5 }) {
  const [rows, setRows] = useState([]);
  const [openProfileId, setOpenProfileId] = useState(null);
  useEffect(() => {
    (async () => setRows(await fetchTopPosters({ limit })))();
  }, [limit]);

  if (!rows.length) return null;

  return (
    <div className="p-4">
      <div className="text-sm font-semibold mb-3">Top Posters</div>
      <ol className="space-y-2">
        {rows.map((r, i) => {
          const isOpen = openProfileId === r.user_id;

          return (
            <li
              key={r.user_id}
              className="flex items-center gap-3 justify-between"
            >
              <span className="w-6 text-right text-xs text-neutral-500">
                {i + 1}.
              </span>

              <button
                type="button"
                onClick={() =>
                  setOpenProfileId(isOpen ? null : r.user_id)
                }
                className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-neutral-50 p-1 rounded-lg transition"
              >
                <img
                  src={r.photo_url || "/avatar.jpg"}
                  alt=""
                  className="w-7 h-7 rounded-full border"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {r.display_name || r.username || r.user_id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {r.username ? `@${r.username}` : ""}
                  </div>
                </div>
              </button>

              <span className="text-xs px-2 py-1 rounded-full border bg-white ml-auto shrink-0">
                🧷 {r.pin_count}
              </span>

              {isOpen && (
                <InlineProfileCard
                  open={isOpen}
                  onClose={() => setOpenProfileId(null)}
                  profile={{
                    id: r.user_id,
                    display_name: r.display_name || r.username,
                    username: r.username,
                    photo_url:
                      r.avatar_url ||
                      r.profiles?.avatar_url ||
                      r.photo_url ||
                      "/avatar.jpg",
                    bio: r.bio || "",
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
