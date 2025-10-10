// src/components/Badge.jsx
import React from "react"
export default function Badge({ count }) {
  if (!count) return null
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
      {count > 99 ? "99+" : count}
    </span>
  )
}
