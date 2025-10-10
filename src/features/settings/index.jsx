// src/features/settings/index.jsx
import { useEffect, useState } from "react";
import ProfileSettings from "./ProfileSettings";
import AccountSettings from "./AccountSettings";

// ✅ use the EDITABLE MyDrops (has Edit/Delete)
import MyDrops from "@/rides/pages/settings/MyDrops.jsx";
import TopPostersWidget from "@/rides/pages/settings/TopPostersWidget.jsx";

export default function Settings() {
  const [tab, setTab] = useState("profile");

  useEffect(() => {
    console.log("[Settings] mounted");
    return () => console.log("[Settings] unmounted");
  }, []);

  const tabs = [
    { key: "privacy", label: "Privacy", disabled: true },
    { key: "profile", label: "Profile" },
    { key: "account", label: "Account" },
    { key: "drops", label: "My Drops" },
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
              "px-3 py-1.5 rounded-full border transition min-h-[36px]",
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

      {tab === "profile" && <ProfileSettings />}
      {tab === "account" && <AccountSettings />}

      {tab === "drops" && (
        <>
          <MyDrops /> {/* ← now shows Edit/Delete */}
          <hr className="my-6 border-neutral-200" />
          <TopPostersWidget limit={5} />
        </>
      )}

      {tab !== "profile" && tab !== "account" && tab !== "drops" && (
        <div className="text-sm opacity-70">Coming soon</div>
      )}
    </div>
  );
}
