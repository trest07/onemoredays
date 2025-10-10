import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { addPin, getMapCenter } from "@/rides/pages/pinStore"


const TTL_OPTIONS = [
  { label: "24h", value: 24 },
  { label: "7d", value: 24 * 7 },
  { label: "30d", value: 24 * 30 },
]

export default function AddPin() {
  const nav = useNavigate()
  const center = getMapCenter() // only populated if your map calls window.__omdSetMapCenter
  const [form, setForm] = useState({
    lat: center.lat || 0,
    lng: center.lng || 0,
    note: "",
    imageUrl: "",
    ttlHours: 24,
  })

  function onChange(e) {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: name === "ttlHours" ? Number(value) : value }))
  }

  function setFromGeolocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      setForm((s) => ({ ...s, lat: latitude, lng: longitude }))
    })
  }

  function onSubmit(e) {
    e.preventDefault()
    const { lat, lng, note, imageUrl, ttlHours } = form
    addPin({ lat: Number(lat), lng: Number(lng), note: note.trim(), imageUrl: imageUrl.trim(), ttlHours })
    nav("/pins/mine")
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Add a Pin</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Latitude</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              name="lat"
              value={form.lat}
              onChange={onChange}
              type="number"
              step="0.000001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Longitude</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              name="lng"
              value={form.lng}
              onChange={onChange}
              type="number"
              step="0.000001"
              required
            />
          </div>
        </div>

        <div>
          <button type="button" onClick={setFromGeolocation} className="text-sm underline">
            Use my current location
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium">Note</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            name="note"
            value={form.note}
            onChange={onChange}
            placeholder="e.g., Safe water refill here"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Image URL (optional)</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            name="imageUrl"
            value={form.imageUrl}
            onChange={onChange}
            placeholder="https://…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Visible for</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            name="ttlHours"
            value={form.ttlHours}
            onChange={onChange}
          >
            {TTL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <button className="px-4 py-2 rounded-md border bg-black text-white">Save Pin</button>
        </div>
      </form>
    </div>
  )
}
