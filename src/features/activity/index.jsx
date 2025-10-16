// src/features/settings/index.jsx
import { useEffect, useState } from "react";

// ✅ use the EDITABLE MyDrops (has Edit/Delete)
import MyDrops from "@/rides/pages/settings/MyDrops.jsx";
import TopPostersWidget from "@/rides/pages/settings/TopPostersWidget.jsx";
import ConnectionsTab from "../../profile/components/ConnectionsTab";
import ProfilePhotos from "../../profile/components/ProfilePhotos";

export default function Activity() {
  const [tab, setTab] = useState("drops");

  const tabs = [
    { key: "drops", label: "My Drops" },
    { key: "photos", label: "My Photos" },
    { key: "connections", label: "Connections" },
  ];

  return (
    <div className="p-4 relative">
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            disabled={t.disabled}
            onClick={() => { if (!t.disabled) setTab(t.key); }}
            type="button"
            className={[
              "px-3 rounded-full border transition min-h-[36px] shadow-md",
              t.disabled
                ? "opacity-40 cursor-not-allowed"
                : tab === t.key
                ? "bg-black text-white border-black"
                : "border-neutral-300 hover:bg-black/5"
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "drops" && (
        <>
          <MyDrops /> {/* ← now shows Edit/Delete */}
          <hr className="my-6 border-neutral-200" />
          <TopPostersWidget limit={5} />
        </>
      )}

      {tab === "connections" && <ConnectionsTab/>}
      {tab === "photos" && <ProfilePhotos/>}
    </div>
  );
}
