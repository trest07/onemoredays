// src/rides/pages/settings/MyDropsPanel.jsx
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/supabaseClient";
import { fetchMyDropsWithStats } from "@/rides/lib/drops";
import Loading from "../../../components/Loading";

function PinCard({ pin }) {
  const thumb =
    (Array.isArray(pin.media_urls) && pin.media_urls[0]) ||
    pin.image_url ||
    "/placeholder.png";

  const created = pin.created_at
    ? new Date(pin.created_at).toLocaleString()
    : "";

  return (
    <div className="flex gap-3 items-start p-4 bg-white border rounded-2xl shadow-sm">
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
        <img src={thumb} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-neutral-900 truncate">
          {pin.note || "(no note)"}
        </div>
        <div className="text-xs text-neutral-500 mt-0.5">{created}</div>

        <div className="flex gap-2 mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-white text-xs">
            👀 {pin.view_count ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-white text-xs">
            👍 {pin.up_count ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-white text-xs">
            👎 {pin.down_count ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="mb-6">
      <div className="px-1 pb-2 text-sm font-semibold text-neutral-800">
        {title}
      </div>
      <div className="space-y-3">
        {items.map((p) => (
          <PinCard key={p.id} pin={p} />
        ))}
      </div>
    </div>
  );
}

export default function MyDropsPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const userId = u?.user?.id;
        if (!userId) { setRows([]); return; }
        const data = await fetchMyDropsWithStats({ userId });
        if (on) setRows(data ?? []);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const recent3 = useMemo(() =>
    [...rows].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,3)
  , [rows]);

  const mostViewed = useMemo(() =>
    [...rows].sort((a,b) => (b.view_count??0) - (a.view_count??0)).slice(0, 10)
  , [rows]);

  const mostLiked = useMemo(() =>
    [...rows].sort((a,b) => (b.up_count??0) - (a.up_count??0)).slice(0, 10)
  , [rows]);

  const mostDisliked = useMemo(() =>
    [...rows].sort((a,b) => (b.down_count??0) - (a.down_count??0)).slice(0, 10)
  , [rows]);

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div className="p-4">
      <Section title="Recent (3)" items={recent3} />
      <hr className="my-4 border-neutral-200" />
      <Section title="Most Viewed" items={mostViewed} />
      <hr className="my-4 border-neutral-200" />
      <Section title="Most Liked" items={mostLiked} />
      <hr className="my-4 border-neutral-200" />
      <Section title="Most Disliked" items={mostDisliked} />
    </div>
  );
}
