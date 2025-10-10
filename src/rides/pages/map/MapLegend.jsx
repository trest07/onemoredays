// src/rides/pages/map/MapLegend.jsx
import React from "react"

export default function MapLegend({ topOffsetPx = 12 }) {
  return (
    <div
      className="absolute left-3 z-[1500] pointer-events-none"
      style={{ top: `${topOffsetPx}px`, touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      <div className="pointer-events-auto bg-white/90 backdrop-blur border rounded-xl shadow px-3 py-2 text-xs">
        <div className="font-medium mb-1">Legend</div>

        <div className="flex items-center gap-2 py-1">
          {/* Note (🗒️) — yellow sticky */}
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: 18, height: 18, borderRadius: 4,
              background: "linear-gradient(180deg,#facc15 0%, #eab308 100%)",
              boxShadow: "0 1px 2px rgba(0,0,0,.25)",
              fontSize: 11,
            }}
            aria-label="Note"
            title="Text-only drop"
          >🗒️</span>
          <span>Text note</span>
        </div>

        <div className="flex items-center gap-2 py-1">
          {/* Camera (📷) — red/orange circle */}
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: 18, height: 18, borderRadius: 9999,
              background: "linear-gradient(180deg,#E45A12 0%, #8E1E1E 100%)",
              boxShadow: "0 1px 2px rgba(0,0,0,.25)",
              fontSize: 11,
            }}
            aria-label="Camera"
            title="Photo drop"
          >📷</span>
          <span>Photo (with text)</span>
        </div>

        <div className="flex items-center gap-2 py-1">
          {/* Default pin */}
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: 18, height: 18, borderRadius: 9999,
              background: "linear-gradient(180deg,#9ca3af 0%, #6b7280 100%)",
              boxShadow: "0 1px 2px rgba(0,0,0,.25)",
              fontSize: 11,
            }}
            aria-label="Default"
            title="Other / no media or text"
          >📍</span>
          <span>Other</span>
        </div>
      </div>
    </div>
  )
}
