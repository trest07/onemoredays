// src/components/userlink.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * UserLink
 * Builds a profile URL from username (preferred) or userId fallback.
 *
 * Props:
 * - userId?: string
 * - username?: string (no @ needed; we'll strip if present)
 * - avatarUrl?: string
 * - avatarSize?: number (px)
 * - avatarShape?: 'circle' | 'square'
 * - withUsername?: boolean (render @username next to avatar/text if we render default layout)
 * - textSize?: 'xs' | 'sm' | 'base' | 'lg'
 * - showTimestamp?: boolean
 * - timestamp?: string | number | Date
 * - className?: string
 * - children?: ReactNode (if provided, we wrap children without adding our own layout)
 */
export default function UserLink({
  userId,
  username,
  avatarUrl,
  avatarSize = 32,
  avatarShape = "circle",
  withUsername = false,
  textSize = "sm",
  showTimestamp = false,
  timestamp,
  className = "",
  children,
}) {
  const uname = (username || "").replace(/^@/, "");
  const to =
    uname && uname.length > 0
      ? `/profile/${encodeURIComponent(uname)}`
      : userId
      ? `/profile/${encodeURIComponent(userId)}`
      : "/profile";

  // If the caller provides children, just wrap them in a Link.
  if (children) {
    return (
      <Link to={to} className={className} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </Link>
    );
  }

  // Default compact layout (avatar + optional @username)
  const radiusClass =
    avatarShape === "square" ? "rounded-lg" : "rounded-full";
  const textSizeClass =
    textSize === "xs"
      ? "text-xs"
      : textSize === "base"
      ? "text-base"
      : textSize === "lg"
      ? "text-lg"
      : "text-sm";

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 ${className}`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={uname || "user"}
          width={avatarSize}
          height={avatarSize}
          className={`${radiusClass} object-cover border`}
          style={{ width: avatarSize, height: avatarSize }}
        />
      ) : null}
      {withUsername && (
        <span className={`${textSizeClass} text-neutral-800 truncate`}>
          {uname ? `@${uname}` : "Profile"}
        </span>
      )}
      {showTimestamp && timestamp ? (
        <span className="text-[11px] text-neutral-500">
          {formatTs(timestamp)}
        </span>
      ) : null}
    </Link>
  );
}

function formatTs(ts) {
  try {
    const d = ts instanceof Date ? ts : new Date(ts);
    return d.toLocaleString();
  } catch {
    return String(ts);
  }
}
