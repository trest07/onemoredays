// src/rides/pages/map/icons.js
import L from "leaflet";

/** Default blue Leaflet PNG marker */
export const defaultMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Camera badge */
export const cameraMarkerIcon = L.divIcon({
  className: "omd-camera",
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  html: `
    <div style="position:relative;width:22px;height:22px;transform:translateY(2px);">
      <div style="position:absolute;left:10px;bottom:-6px;width:2px;height:8px;background:#8E1E1E;border-radius:2px;opacity:.9;"></div>
      <div style="width:22px;height:22px;border-radius:50%;
          background:linear-gradient(180deg,#E45A12 0%, #8E1E1E 100%);
          box-shadow:0 1px 2px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;">
        📷
      </div>
    </div>
  `,
});

/** Note badge */
export const noteMarkerIcon = L.divIcon({
  className: "omd-note",
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  html: `
    <div style="position:relative;width:22px;height:22px;transform:translateY(2px);">
      <div style="position:absolute;left:10px;bottom:-6px;width:2px;height:8px;background:#b45309;border-radius:2px;opacity:.9;"></div>
      <div style="width:22px;height:22px;border-radius:6px;
          background:linear-gradient(180deg,#facc15 0%, #eab308 100%);
          box-shadow:0 1px 2px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;">
        🗒️
      </div>
    </div>
  `,
});

/** NEW: Pet friendly */
export const petFriendlyIcon = L.divIcon({
  className: "omd-pet",
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  html: `
    <div style="position:relative;width:22px;height:22px;transform:translateY(2px);">
      <div style="position:absolute;left:10px;bottom:-6px;width:2px;height:8px;background:#065f46;border-radius:2px;opacity:.9;"></div>
      <div style="width:22px;height:22px;border-radius:50%;
          background:linear-gradient(180deg,#10b981 0%, #065f46 100%);
          box-shadow:0 1px 2px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;">
        🐾
      </div>
    </div>
  `,
});

/** NEW: Truck stop */
export const truckStopIcon = L.divIcon({
  className: "omd-truck",
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  html: `
    <div style="position:relative;width:22px;height:22px;transform:translateY(2px);">
      <div style="position:absolute;left:10px;bottom:-6px;width:2px;height:8px;background:#7c2d12;border-radius:2px;opacity:.9;"></div>
      <div style="width:22px;height:22px;border-radius:50%;
          background:linear-gradient(180deg,#fb923c 0%, #7c2d12 100%);
          box-shadow:0 1px 2px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;">
        🚚
      </div>
    </div>
  `,
});

/** NEW: Kids friendly / family */
export const kidsFriendlyIcon = L.divIcon({
  className: "omd-kids",
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  html: `
    <div style="position:relative;width:22px;height:22px;transform:translateY(2px);">
      <div style="position:absolute;left:10px;bottom:-6px;width:2px;height:8px;background:#1e3a8a;border-radius:2px;opacity:.9;"></div>
      <div style="width:22px;height:22px;border-radius:50%;
          background:linear-gradient(180deg,#60a5fa 0%, #1e3a8a 100%);
          box-shadow:0 1px 2px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;">
        👨‍👩‍👧
      </div>
    </div>
  `,
});

/** NEW: Restroom */
export const restroomIcon = L.divIcon({
  className: "omd-restroom",
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  html: `
    <div style="position:relative;width:22px;height:22px;transform:translateY(2px);">
      <div style="position:absolute;left:10px;bottom:-6px;width:2px;height:8px;background:#334155;border-radius:2px;opacity:.9;"></div>
      <div style="width:22px;height:22px;border-radius:50%;
          background:linear-gradient(180deg,#cbd5e1 0%, #334155 100%);
          box-shadow:0 1px 2px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;">
        🚻
      </div>
    </div>
  `,
});

/** NEW: Restaurant */
export const restaurantIcon = L.divIcon({
  className: "omd-restaurant",
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  html: `
    <div style="position:relative;width:22px;height:22px;transform:translateY(2px);">
      <div style="position:absolute;left:10px;bottom:-6px;width:2px;height:8px;background:#7f1d1d;border-radius:2px;opacity:.9;"></div>
      <div style="width:22px;height:22px;border-radius:50%;
          background:linear-gradient(180deg,#f87171 0%, #7f1d1d 100%);
          box-shadow:0 1px 2px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;">
        🍴
      </div>
    </div>
  `,
});

/** NEW: Gas station */
export const gasStationIcon = L.divIcon({
  className: "omd-gas",
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  html: `
    <div style="position:relative;width:22px;height:22px;transform:translateY(2px);">
      <div style="position:absolute;left:10px;bottom:-6px;width:2px;height:8px;background:#164e63;border-radius:2px;opacity:.9;"></div>
      <div style="width:22px;height:22px;border-radius:50%;
          background:linear-gradient(180deg,#22d3ee 0%, #164e63 100%);
          box-shadow:0 1px 2px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;">
        ⛽
      </div>
    </div>
  `,
});
