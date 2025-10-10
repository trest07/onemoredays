// src/rides/pages/map/MapView.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import PinComposer from "../../components/PinComposer.jsx";
import { addDrop, fetchActiveDrops } from "@/rides/lib/drops.js";
import { compressImageFile, uploadToCloudflare } from "../../../lib/uploadToCloudflare.js";
import DropPopup from "./DropPopup";
import {
  defaultMarkerIcon,
  cameraMarkerIcon,
  noteMarkerIcon,
  petFriendlyIcon as _petFriendlyIcon,
  truckStopIcon as _truckStopIcon,
  kidsFriendlyIcon as _kidsFriendlyIcon,
  restroomIcon as _restroomIcon,
  restaurantIcon as _restaurantIcon,
  gasStationIcon as _gasStationIcon,
  publicParkIcon as _publicParkIcon
} from "./icons";
import MapControls from "./MapControls.jsx";
import { supabase } from "@/supabaseClient";

// leaflet image fix (vite)
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl: marker2x, iconUrl: marker1x, shadowUrl: markerShadow });

const NAV_HEIGHT_PX = 64;
const BOTTOM_OFFSET_PX = NAV_HEIGHT_PX + 32;

/* ---------- Error Boundary ---------- */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, message: "" }; }
  static getDerivedStateFromError(err) { return { hasError: true, message: err?.message || "Unknown error" }; }
  componentDidCatch(err, info) { console.error("MapView crashed:", err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-sm">
          <div className="mb-2 font-semibold">Something went wrong in MapView.</div>
          <div className="text-red-600">{this.state.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- Helpers ---------- */
function omdMediaKey({ userId = "anon", originalName = "upload.jpg" } = {}) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const ext = (originalName.match(/\.(\w{1,8})$/i)?.[1] || "jpg").toLowerCase();
  const rand = Math.random().toString(36).slice(2, 8);
  return `onemoreday/posts/${userId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`;
}

function isSafeUrl(url) {
  if (!url) return true;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const allowed = [
      "vibezcitizens.com", "cdn.vibezcitizens.com",
      "youtube.com", "www.youtube.com", "youtu.be",
      "instagram.com", "www.instagram.com",
      "tiktok.com", "www.tiktok.com",
      "linktr.ee", "www.linktr.ee",
      "facebook.com", "www.facebook.com",
      "x.com", "twitter.com", "www.twitter.com",
      "google.com", "www.google.com",
    ];
    const banned = ["porn", "sex", "redtube", "xvideos", "xnxx", "onlyfans"];
    if (banned.some((x) => url.toLowerCase().includes(x))) return false;
    return allowed.includes(host);
  } catch { return false; }
}

// safe hashtag parse (used to enforce at least one tag)
function extractHashtags(text = "") {
  const out = new Set();
  const re = /(^|\s)#([a-z0-9_]{2,30})/gi;
  let m;
  while ((m = re.exec(text || "")) !== null) {
    out.add(String(m[2]).toLowerCase());
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return Array.from(out);
}

function LiveLocationDot({ coords }) {
  if (!Array.isArray(coords)) return null;
  return <Circle center={coords} radius={10} pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 1 }} />;
}

function FollowUser({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!Array.isArray(coords)) return;
    try { map.setView(coords, map.getZoom(), { animate: true }); } catch {}
  }, [coords, map]);
  return null;
}

// icons (fallback to note icon when not present)
const petFriendlyIcon = _petFriendlyIcon || noteMarkerIcon;
const truckStopIcon   = _truckStopIcon   || noteMarkerIcon;
const kidsFriendlyIcon= _kidsFriendlyIcon|| noteMarkerIcon;
const restroomIcon    = _restroomIcon    || noteMarkerIcon;
const restaurantIcon  = _restaurantIcon  || noteMarkerIcon;
const gasStationIcon  = _gasStationIcon  || noteMarkerIcon;
const publicParkIcon  = _publicParkIcon  || noteMarkerIcon;

function getMarkerIconForDrop(d) {
  const t = (d?.note || "").toLowerCase();
  try {
    if (/(^|\s)#?(pet|pet_friendly|petfriendly)\b/.test(t)) return petFriendlyIcon;
    if (/(^|\s)#?(truckstop|truck_stop|truck|truckfriendly|truck_friendly)\b/.test(t)) return truckStopIcon;
    if (/(^|\s)#?(kids|kidsfriendly|kids_friendly|family)\b/.test(t)) return kidsFriendlyIcon;
    if (/(^|\s)#?(restroom|bathroom|toilet|wc)\b/.test(t)) return restroomIcon;
    if (/(^|\s)#?(restaurant|food|eat|diner|tacos)\b/.test(t)) return restaurantIcon;
    if (/(^|\s)#?(gas|gasstation|fuel|diesel)\b/.test(t)) return gasStationIcon;
    if (/(^|\s)#?(park|publicpark)\b/.test(t)) return publicParkIcon;
  } catch {}
  if (d?.image_url || d?.media_url) return cameraMarkerIcon;
  if (d?.note) return noteMarkerIcon;
  return defaultMarkerIcon;
}

/* ---------- Page ---------- */
export default function MapView() {
  const navigate = useNavigate();

  // auth
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setAuthed(Boolean(data?.user));
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(Boolean(s?.user));
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // drops
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const visibleDrops = drops;

  // composer
  const [showComposer, setShowComposer] = useState(false);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]); // up to 3
  const [imageUrlOverride, setImageUrlOverride] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");
  const noteRef = useRef(null);

  // user location (map centers on user)
  const [userCoords, setUserCoords] = useState(null);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => { try { navigator.geolocation.clearWatch(id); } catch {} };
  }, []);

  // load drops
  async function loadDrops() {
    setLoading(true);
    try {
      const data = await fetchActiveDrops(null);
      setDrops(data || []);
    } catch (e) {
      setErr(e?.message ?? "Failed to load drops");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadDrops(); }, []);

  // add pin flow
  async function handleAdd() {
    setAdding(true);
    setErr("");
    try {
      // require at least one hashtag in the Note
      const tags = extractHashtags(note);
      if (tags.length === 0) throw new Error("Add at least one #hashtag in the note.");

      // location
      const here = await new Promise((resolve) => {
        navigator.geolocation?.getCurrentPosition(
          (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
          () => resolve(null),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      });
      if (!here) throw new Error("Location unavailable. Enable GPS and try again.");
      const [lat, lng] = here;

      if (linkUrl && !isSafeUrl(linkUrl)) throw new Error("That link is not allowed.");

      // uploads (up to 3)
      let media_urls = [];
      if (files?.length) {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id || "anon";
        for (let i = 0; i < Math.min(files.length, 3); i++) {
          const f = files[i];
          const compressed = await compressImageFile(f, 1280, 0.82);
          const key = omdMediaKey({ userId: uid, originalName: f.name });
          const { url, error } = await uploadToCloudflare(compressed, key);
          if (error) throw new Error(error);
          media_urls.push(url);
        }
      } else if (imageUrlOverride?.trim()) {
        media_urls = [imageUrlOverride.trim()];
      }

      // Keep legacy media_url for old clients: first element or null
      const legacy_media_url = media_urls.length ? media_urls[0] : null;

      await addDrop(null, {
        lat,
        lng,
        note: note?.trim() || null,
        media_url: legacy_media_url,              // legacy single
        media_urls: media_urls.length ? media_urls : null, // new multi
        link_url: linkUrl?.trim() || null,
        is_private: false,
      });

      // reset
      setNote("");
      setFiles([]);
      setImageUrlOverride("");
      setLinkUrl("");
      setShowComposer(false);
      await loadDrops();
    } catch (e) {
      setErr(e?.message ?? "Failed to add pin");
    } finally {
      setAdding(false);
    }
  }

  // global "open composer" event (auth-aware)
  useEffect(() => {
    const onAdd = () => {
      if (!authed) return navigate("/login");
      setShowComposer(true);
      setTimeout(() => noteRef.current?.focus(), 0);
    };
    window.addEventListener("onemoreday:add-pin", onAdd);
    return () => window.removeEventListener("onemoreday:add-pin", onAdd);
  }, [authed, navigate]);

  return (
    <ErrorBoundary>
      <div className="relative">
        <div
          className="relative"
          style={{ height: `calc(100dvh - (${NAV_HEIGHT_PX}px + env(safe-area-inset-bottom)))` }}
        >
          {/* Composer */}
          <PinComposer
            show={showComposer}
            onClose={() => setShowComposer(false)}
            bottomOffset={BOTTOM_OFFSET_PX}
            err={err}
            isAuthed={authed}
            isMember={true}
            noteRef={noteRef}
            note={note}
            setNote={setNote}
            // accept both single and multiple flows from the component
            onFilesChange={(listOrArray) => {
              const arr = Array.isArray(listOrArray) ? listOrArray : Array.from(listOrArray || []);
              setFiles(arr.slice(0, 3));
            }}
            onFileChange={(file) => setFiles(file ? [file] : [])}
            preview={[]} // composer handles its own previews for multiple files
            imageUrlOverride={imageUrlOverride}
            setImageUrlOverride={setImageUrlOverride}
            adding={adding}
            onAdd={handleAdd}
            onRefresh={loadDrops}
            linkUrl={linkUrl}
            setLinkUrl={setLinkUrl}
          />

          {/* Map waits for real user location so initial center = user */}
          {userCoords ? (
            <MapContainer center={userCoords} zoom={12} className="h-full w-full" preferCanvas tap={false}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                subdomains={["a", "b", "c", "d"]}
                maxZoom={20}
              />
              <TileLayer
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                subdomains={["a", "b", "c", "d"]}
                maxZoom={20}
              />

              <LiveLocationDot coords={userCoords} />
              <FollowUser coords={userCoords} />
              <MapControls coords={userCoords} topOffsetPx={NAV_HEIGHT_PX + 12} />

              {visibleDrops.map((d) => {
                // lat/lng may arrive as strings from Postgres numeric
                const lat = typeof d.lat === "number" ? d.lat : parseFloat(d.lat);
                const lng = typeof d.lng === "number" ? d.lng : parseFloat(d.lng);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

                return (
                  <Marker key={d.id} position={[lat, lng]} icon={getMarkerIconForDrop(d)}>
                    <Popup closeButton={false} closeOnClick closeOnEscapeKey>
                      <DropPopup
                        id={d.id}
                        media_url={d.image_url || d.media_url || null}
                        media_urls={d.media_urls || null}   // pass array to popup (carousel)
                        note={d.note}
                        authorName={
                          d.display_name ||
                          d.username ||
                          d.profiles?.display_name ||
                          d.profiles?.username ||
                          "Anonymous"
                        }
                        authorPhoto={
                          d.avatar_url ||
                          d.profiles?.avatar_url ||
                          d.photo_url ||
                          "/avatar.jpg"
                        }
                        createdAt={d.created_at}
                        isAuthed={authed}
                        authorId={d.user_id || d.profiles?.id}
                        authorUsername={d.username || d.profiles?.username}
                        authorBio={d.bio || d.profiles?.bio}
                        authorPostsCount={d.posts_count ?? d.profiles?.posts_count ?? 0}
                        authorNotesCount={d.notes_count ?? d.profiles?.notes_count ?? 0}
                        iconUrl={getMarkerIconForDrop(d)?.options?.html}
                      />
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          ) : (
            <div className="h-full w-full grid place-items-center text-sm text-gray-600">
              Enable location to load the map…
            </div>
          )}

          {/* Floating + button — hide when composer is open to avoid overlap */}
          {!showComposer && (
            <div
              className="fixed right-4 z-[2000]"
              style={{ bottom: `calc(${BOTTOM_OFFSET_PX}px + env(safe-area-inset-bottom))` }}
            >
              <button
                type="button"
                className="w-12 h-12 rounded-full bg-black text-white shadow flex items-center justify-center active:scale-95 transition"
                aria-label="Add Pin"
                title="Add Pin"
                onClick={() => {
                  if (!authed) return navigate("/login");
                  setShowComposer(true);
                  setTimeout(() => noteRef.current?.focus(), 0);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <style>{`
          .leaflet-pane.leaflet-labels-pane {
            z-index: 600 !important;
            pointer-events: none !important;
          }
        `}</style>

        {loading && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="px-3 py-2 rounded-lg bg-white/90 border shadow text-sm">Loading…</div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
