// src/rides/pages/map/useLivePosition.js
import { useEffect, useState } from "react"

/**
 * Minimal live GPS:
 * - getCurrentPosition for fast initial center
 * - watchPosition to follow
 * - returns { pos: {lat,lng}|null, ready: boolean }
 */
export default function useLivePosition() {
  const [pos, setPos] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setReady(true)
      return
    }
    const opts = { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
    let watchId = null

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude }
        setPos(here)
        setReady(true)
        watchId = navigator.geolocation.watchPosition(
          (wp) => setPos({ lat: wp.coords.latitude, lng: wp.coords.longitude }),
          () => {},
          opts
        )
      },
      () => setReady(true),
      opts
    )

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return { pos, ready }
}
