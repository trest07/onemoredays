import React from "react"

/** Small helper: initials from a name */
function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "U"
}

const emberGrad = "linear-gradient(180deg, #E45A12 0%, #8E1E1E 100%)"

export default function ProfileCard({
  name,
  username,
  photoUrl,
  subtitle,
  postsCount = 0,   // 📷
  notesCount = 0,   // 📝
  actionLabel = "View",
  onAction,
  onClick,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
      className="group w-full max-w-xl select-none rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{
        border: "1px solid transparent",
        backgroundImage: `linear-gradient(white, white), ${emberGrad}`,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name || "profile"}
              className="h-16 w-16 rounded-xl object-cover border"
            />
          ) : (
            <div
              className="h-16 w-16 rounded-xl grid place-items-center text-white font-semibold"
              style={{ background: emberGrad }}
            >
              {initials(name)}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border bg-white grid place-items-center">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} />
          </span>
        </div>

        {/* Texts */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900 truncate">{name}</h3>
          </div>
          {username ? (
            <div className="text-sm text-gray-500 truncate">
              {username.startsWith("@") ? username : `@${username}`}
            </div>
          ) : null}
          {subtitle ? (
            <div className="mt-0.5 text-xs text-gray-500 truncate">{subtitle}</div>
          ) : null}

          {/* ✅ Stats row with inline SVG icons (cross-platform) */}
          <div className="mt-2 flex gap-4 text-xs text-gray-700">
            {/* Notes */}
            <span className="inline-flex items-center gap-1.5">
              {/* 📝 */}
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor"
                  d="M19 3H8a2 2 0 0 0-2 2v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-3 14H5V9h11Zm3-4h-1V7a2 2 0 0 0-2-2H8V5h11Z"/>
              </svg>
              <span>{notesCount}</span>
            </span>

            {/* Photos */}
            <span className="inline-flex items-center gap-1.5">
              {/* 📷 */}
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor"
                  d="M9 3h6l1.5 2H21a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4.5L9 3Zm3 14a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z"/>
              </svg>
              <span>{postsCount}</span>
            </span>
          </div>
        </div>

        {/* Action */}
        {actionLabel ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAction?.()
            }}
            className="rounded-xl px-3 py-1.5 text-white text-sm font-medium shadow hover:opacity-95 transition"
            style={{ background: emberGrad }}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
