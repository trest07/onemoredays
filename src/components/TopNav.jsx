// src/components/TopNav.jsx
import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import NotificationIcon from "../notifications/components/NotificationIcon"

const DAYS_PER_DOLLAR = 7

// Clean "apocalyptic" ember style (subtle, not flashy)
const apocalypticStyle = {
  background: "linear-gradient(180deg, #E45A12 0%, #8E1E1E 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  WebkitTextStrokeWidth: "0.4px",
  WebkitTextStrokeColor: "#111",              // thin dark outline
  paintOrder: "stroke fill",
  textShadow: "0 1px 1px rgba(0,0,0,0.35)",   // very subtle depth
}

function nextJanuaryFirst(from = new Date()) {
  const y =
    from.getMonth() > 0 || (from.getMonth() === 0 && from.getDate() >= 1)
      ? from.getFullYear() + 1
      : from.getFullYear()
  return new Date(y, 0, 1, 0, 0, 0, 0)
}

function pad(n) {
  return String(n).padStart(2, "0")
}

function fmtDeadline(d) {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function TopNav() {
  const [now, setNow] = useState(() => Date.now())
  const [fundedUSD, setFundedUSD] = useState(() => {
    const raw = localStorage.getItem("omd.fundedUSD")
    const num = raw ? Number(raw) : 0
    return Number.isFinite(num) && num >= 0 ? num : 0
  })

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "omd.fundedUSD") {
        const num = e.newValue ? Number(e.newValue) : 0
        setFundedUSD(Number.isFinite(num) && num >= 0 ? num : 0)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const deadline = useMemo(() => {
    const base = nextJanuaryFirst(new Date(now))
    const extraDays = fundedUSD * DAYS_PER_DOLLAR
    const extended = new Date(base)
    extended.setDate(extended.getDate() + extraDays)
    return extended
  }, [now, fundedUSD])

  const remainingMs = Math.max(0, deadline.getTime() - now)
  const totalSeconds = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const destroyed = remainingMs === 0
  const fundedDays = fundedUSD * DAYS_PER_DOLLAR

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Brand + Powered by */}
          <div className="flex flex-col items-start">
            <Link
              to="/"
              className="font-bold text-xl select-none"
              style={apocalypticStyle}
            >
              One More Day
            </Link>
            <span className="mt-1 text-[11px] text-gray-600">
              <span className="opacity-70">Powered by </span>
              <span className="font-medium">Vibez Citizens</span>
            </span>
          </div>

          {/* Right: Countdown */}
          <div className="flex items-center space-x-8">
          <div className="flex flex-col items-end">
            <div className="text-xs sm:text-sm text-gray-700 font-mono px-3 py-1 rounded-lg border bg-white/80">
              {destroyed ? (
                <span>💥 DESTROYED</span>
              ) : (
                <span>
                  ⏳ {days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)}
                </span>
              )}
            </div>
            <div className="mt-1 text-[10px] sm:text-xs text-gray-500">
              Deadline: <strong>{fmtDeadline(deadline)}</strong>
              {fundedDays > 0 && (
                <> &nbsp;(+{fundedDays} days funded from ${fundedUSD})</>
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              Rule: 1 → +7 days
            </div>
            
          </div>
          <NotificationIcon />
          </div>
          
        </div>
        
      </div>
    </header>
  )
}
