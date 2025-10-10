// src/rides/pages/map/markers.js
import L from "leaflet"

const dot = (color) =>
  new L.DivIcon({
    className: "leaflet-div-icon",
    html: `<div style="width:12px;height:12px;border-radius:9999px;background:${color};
            box-shadow:0 0 0 3px ${color}22"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })

export const meIcon = dot("#16a34a")      // green
export const pickupIcon = dot("#2563eb")  // blue
export const dropoffIcon = dot("#22c55e") // lime green
