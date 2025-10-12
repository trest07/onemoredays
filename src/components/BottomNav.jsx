// BottomNav.jsx — Map + Settings only
import React from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";

const Icon = ({ d }) => (
  <svg
    viewBox="0 0 24 24"
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const Tab = ({ to, label, icon, isRoot }) => (
  <NavLink
    to={to}
    end={isRoot}
    className={({ isActive }) =>
      [
        "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition",
        isActive ? "text-primary bg-primary/10" : "text-gray-600 hover:text-primary",
      ].join(" ")
    }
    // keep taps from leaking to Leaflet
    onTouchStartCapture={(e) => e.stopPropagation()}
    onPointerDownCapture={(e) => e.stopPropagation()}
    onMouseDownCapture={(e) => e.stopPropagation()}
  >
    <Icon d={icon} />
    <span className="text-xs font-medium">{label}</span>
  </NavLink>
);

function InnerNav() {
  // Icons
  const icons = {
    map: "M9 3l-6 2v16l6-2 6 2 6-2V3l-6 2-6-2zM9 5v14M15 7v14",
    toggle: "M4 12h16M7 8a4 4 0 1 1 0 8",
    activity: "M3 12h3l2 7l4-14l4 14l2-7h3"
  };

  // Only 2 tabs now
  const tabs = [
    { to: "/rides/map", label: "Map", icon: icons.map, isRoot: true },
    { to: "/activity", label: "Activity", icon: icons.activity },
    { to: "/settings", label: "Settings", icon: icons.toggle },    
  ];

  return (
    <nav
      id="bottom-nav"
      aria-label="Primary"
      className="fixed left-0 right-0 bottom-0 p-3"
      style={{
        zIndex: 2147483647,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        pointerEvents: "auto",
        background: "transparent",
      }}
      onTouchStartCapture={(e) => e.stopPropagation()}
      onPointerDownCapture={(e) => e.stopPropagation()}
      onMouseDownCapture={(e) => e.stopPropagation()}
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-4 rounded-2xl border border-gray-200 bg-white shadow-lg px-2 py-2 grid grid-cols-3 gap-1">
          {tabs.map((t) => (
            <Tab key={t.to} to={t.to} label={t.label} icon={t.icon} isRoot={t.isRoot} />
          ))}
        </div>
      </div>
    </nav>
  );
}

export default function BottomNav() {
  return createPortal(<InnerNav />, document.body);
}
