// src/rides/pages/map/MapControls.jsx
import React, { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import Loading from '../../../components/Loading'

export default function MapControls({ coords, topOffsetPx = 12 }) {
  const map = useMap()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  async function runSearch(e) {
    e?.preventDefault?.()
    const term = q.trim()
    if (!term) return
    setLoading(true); setResults([])
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=6&addressdetails=1`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function flyTo(lat, lon) {
    try { map.flyTo([parseFloat(lat), parseFloat(lon)], 17, { duration: 0.8 }) } catch {}
  }

  function recenter(e) {
    e.preventDefault()
    e.stopPropagation()
    if (Array.isArray(coords) && coords.length === 2) {
      map.flyTo(coords, 16, { duration: 0.7 })
    } else {
      const c = map.getCenter()
      map.flyTo([c.lat + 0.0005, c.lng + 0.0005], map.getZoom(), { duration: 0.25 })
      setTimeout(() => map.flyTo(c, map.getZoom(), { duration: 0.25 }), 280)
    }
  }

  return (
    <div
      className="absolute right-3 z-[1500] flex flex-col gap-2 pointer-events-none"
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        // ⬇️ Push controls BELOW the top nav:
        top: `${topOffsetPx}px`,
      }}
    >
      <div className="flex justify-end gap-2 pointer-events-auto">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v) }}
          className="w-10 h-10 rounded-full bg-white border shadow grid place-items-center hover:bg-gray-50"
          title="Search address"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
          </svg>
        </button>

        <button
          onClick={recenter}
          className="w-10 h-10 rounded-full bg-white border shadow grid place-items-center hover:bg-gray-50"
          title="Recenter to my location"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3l6 18-6-4-6 4 6-18z" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          ref={boxRef}
          className="mt-2 w=[min(480px,75vw)] bg-white/95 backdrop-blur border rounded-xl shadow-lg p-2 pointer-events-auto"
        >
          <form onSubmit={runSearch} className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search address or place..."
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button type="submit" className="px-3 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100">
              {loading ? <Loading text={'Searching…' }/>: 'Search'}
            </button>
          </form>

          {!!results.length && (
            <ul className="mt-2 max-h-64 overflow-auto divide-y">
              {results.map((r, i) => (
                <li
                  key={`${r.place_id}-${i}`}
                  className="py-2 px-1 cursor-pointer hover:bg-gray-50 rounded"
                  onClick={() => { flyTo(r.lat, r.lon); setOpen(false) }}
                  title={r.display_name}
                >
                  <div className="text-sm">{r.display_name}</div>
                </li>
              ))}
            </ul>
          )}

          {!loading && q && results.length === 0 && (
            <div className="mt-2 text-sm text-gray-600 px-1">No results.</div>
          )}
        </div>
      )}
    </div>
  )
}
