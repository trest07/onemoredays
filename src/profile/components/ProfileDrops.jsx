import { useEffect, useState } from "react";
import { listDropsByProfile } from "../../rides/lib/drops.js";
import InlineProfileCard from "../../rides/components/InlineProfileCard.jsx";
import DropPopup from "../../rides/pages/map/DropPopup.jsx";
import { DropItem } from "../../rides/pages/settings/MyDrops.jsx";
import Loading from "../../components/Loading.jsx";

export default function ProfileDrops({ profileId }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await listDropsByProfile(profileId);
        if (mounted) setItems(rows);
      } catch (e) {
        if (mounted) setErr(e.message ?? "Failed to load drops");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [profileId]);

  if (err) return <div className="text-red-600">{err}</div>;
  if (!items) return <Loading text={"Loading…"}/>;
  if (!items.length) return <div className="p-4 text-gray-500">No drops yet.</div>;

  return (
    <div className="space-y-4">
      {items.map((drop) => (
        <div key={drop.id} className="border rounded p-3 shadow-sm">
          <InlineProfileCard
            profileId={drop.author_id}
            timestamp={drop.created_at}
          />
          <div className="mt-2">
            {/* <DropPopup drop={drop} compact /> */}
            <DropItem key={drop.id} d={drop} userId={profileId} />
          </div>
        </div>
      ))}
    </div>
  );
}
