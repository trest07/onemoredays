// src/rides/pages/map/DropPopup.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/supabaseClient";
import {
  getVote,
  setVote,
  getVoteCounts,
  recordView,
  getViewCount,
} from "@/rides/lib/drops"; // note the absolute alias
import MediaLightbox from "@/rides/pages/map/ui/MediaLightbox.jsx";
import InlineProfileCard from "@/rides/components/InlineProfileCard.jsx";

import RatingStars from "@/rides/components/RatingStars.jsx";
import CommentsSection from "@/rides/components/CommentsSection.jsx";
import { useAuth } from "../../../context/AuthContext";
import { useAlert } from "../../../context/AlertContext";

/* ------------------------------ utils ------------------------------ */

function timeAgo(input) {
  if (!input) return "";
  const now = Date.now();
  const t = new Date(input).getTime();
  const s = Math.max(1, Math.floor((now - t) / 1000));
  const units = [
    ["y", 60 * 60 * 24 * 365],
    ["mo", 60 * 60 * 24 * 30],
    ["w", 60 * 60 * 24 * 7],
    ["d", 60 * 60 * 24],
    ["h", 60 * 60],
    ["m", 60],
    ["s", 1],
  ];
  for (const [label, sec] of units) {
    const v = Math.floor(s / sec);
    if (v >= 1) return `${v}${label} ago`;
  }
  return "just now";
}

function Avatar({ src, size = 28, alt = "" }) {
  return (
    <img
      src={src || "/avatar.jpg"}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full object-cover border border-neutral-200"
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
    />
  );
}

/* --------------------------- tiny carousel -------------------------- */

function Carousel({ items = [], onOpenLightbox }) {
  const [idx, setIdx] = useState(0);
  const startXRef = useRef(null);
  const count = items.length;

  if (!count) return null;

  const next = () => setIdx((i) => Math.min(i + 1, count - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  const onTouchStart = (e) => {
    startXRef.current = e.touches?.[0]?.clientX ?? null;
  };
  const onTouchMove = (e) => {
    const x0 = startXRef.current;
    if (x0 == null) return;
    const dx = e.touches?.[0]?.clientX - x0;
    if (Math.abs(dx) > 40) {
      dx < 0 ? next() : prev();
      startXRef.current = null;
    }
  };
  const onTouchEnd = () => {
    startXRef.current = null;
  };

  const cur = items[idx];
  const isVideo = /\.(mp4|webm|ogg)$/i.test(cur);

  return (
    <div className="relative rounded-lg overflow-hidden border select-none">
      <div
        className="w-[260px] h-[160px] relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          onClick={() => onOpenLightbox(cur)}
          className="absolute inset-0"
        >
          {isVideo ? (
            <video
              src={cur}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <img
              src={cur}
              alt="media"
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
        </button>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 border shadow grid place-items-center"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 border shadow grid place-items-center"
            aria-label="Next"
          >
            ›
          </button>
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
            {items.map((_, i) => (
              <span
                key={i}
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  i === idx ? "bg-black" : "bg-black/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ component --------------------------- */

export default function DropPopup({
  id,
  media_url, // legacy single
  media_urls, // array (optional)
  note,
  authorName,
  authorPhoto,
  createdAt,
  authorId,
  authorBio,
  authorUsername,
  authorPostsCount = 0,
  authorNotesCount = 0,
  iconUrl = null,
}) {
  const [uid, setUid] = useState(null);
  const [myVote, setMyVote] = useState(0);
  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);
  const [views, setViews] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const { showAlert } = useAlert();

  // keep auth state in sync (fixes disabled buttons after login)
    const { loggedUser } = useAuth();
  useEffect(() => {
    let alive = true;
    (async () => {
      // const { data } = await supabase.auth.getUser();
      if (alive) setUid(loggedUser?.id ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUid(session?.user?.id ?? null);
    });
    return () => {
      sub?.subscription?.unsubscribe?.();
      alive = false;
    };
  }, []);

  const canVote = useMemo(() => Boolean(uid && id), [uid, id]);

  // Prefer array; fall back to single url
  const gallery = useMemo(() => {
    const arr = Array.isArray(media_urls) ? media_urls.filter(Boolean) : [];
    if (arr.length) return arr.slice(0, 10);
    return media_url ? [media_url] : [];
  }, [media_urls, media_url]);

  // load counts + my vote for this pin
  useEffect(() => {
    if (!id) return;
    let on = true;
    (async () => {
      try {
        recordView(id);

        const [count, votes] = await Promise.all([
          getViewCount(id),
          getVoteCounts(id),
        ]);
        if (!on) return;
        setViews(count);
        setUp(votes.up);
        setDown(votes.down);

        // fetch my current vote if logged in
        // const { data } = await supabase.auth.getUser();
        const userId = loggedUser?.id;
        if (!on) return;
        if (userId) {
          const v = await getVote(id, userId);
          if (!on) return;
          setMyVote(v ?? 0);
        } else {
          setMyVote(0);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      on = false;
    };
  }, [id]);

  async function handleVote(next) {
    if (!canVote) return;
    const old = myVote;
    const nextVal = next === old ? 0 : next;

    // optimistic UI
    if (old === 1) setUp((c) => c - 1);
    if (old === -1) setDown((c) => c - 1);
    if (nextVal === 1) setUp((c) => c + 1);
    if (nextVal === -1) setDown((c) => c + 1);
    setMyVote(nextVal);

    try {
      await setVote(id, nextVal); // uses correct onConflict order in lib
    } catch (e) {
      // revert on failure
      if (nextVal === 1) setUp((c) => c - 1);
      if (nextVal === -1) setDown((c) => c - 1);
      if (old === 1) setUp((c) => c + 1);
      if (old === -1) setDown((c) => c + 1);
      setMyVote(old);
      // alert(e?.message || "Failed to vote");
      showAlert({ message: e?.message || "Failed to vote", type: "warning" });
    }
  }

  function hidePin() {
    setHidden(true);
    setMenuOpen(false);
    try {
      window.dispatchEvent(new CustomEvent("omd:hide-pin", { detail: { id } }));
    } catch {}
  }

  async function reportPin() {
    setMenuOpen(false);
    try {
      const reason = prompt("Report reason? (required)");
      if (!reason || !reason.trim()) return;

      if (!uid) {
        // alert("You must be signed in to report a pin.");
        showAlert({ message:"You must be signed in to report a pin.", type: "warning" });
        return;
      }

      const { error } = await supabase
        .schema("omd")
        .from("pin_reports")
        .insert([{ pin_id: id, reason: reason.trim(), reporter_id: uid }]);

      if (error) throw error;
      // alert("Thanks. We received your report.");
      showAlert({ message:"Thanks. We received your report.", type: "success" });
    } catch (e) {
      // alert(e?.message || "Failed to submit report");
      showAlert({ message:e?.message || "Failed to submit report", type: "warning" });
    }
  }

  if (hidden) return null;

  // Fallback single media type detection (if not using the carousel)
  const singleMediaType = media_url
    ? /\.(mp4|webm|ogg)$/i.test(media_url)
      ? "video"
      : "image"
    : null;

  return (
    <div className="relative w-[260px] max-w-[80vw]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {iconUrl && (
          <div
            className="w-6 h-5 flex-shrink-0 self-start"
            dangerouslySetInnerHTML={{ __html: iconUrl }}
          />
        )}
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-2 focus:outline-none"
        >
          <Avatar src={authorPhoto} alt={authorName || "profile"} />
          <div className="text-left">
            <div className="text-sm font-medium text-neutral-900 truncate">
              {authorName || "Anonymous"}
            </div>
            <div className="text-[11px] text-neutral-500">
              dropped a pin{createdAt ? ` · ${timeAgo(createdAt)}` : ""}
            </div>
          </div>
        </button>

        {/* menu */}
        <div className="relative ml-auto">
          <button
            type="button"
            className="p-1 text-neutral-500 hover:text-neutral-800"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More actions"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.9" />
              <circle cx="12" cy="12" r="1.9" />
              <circle cx="12" cy="19" r="1.9" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-28 bg-white border rounded shadow text-sm z-50">
              <button
                className="block w-full text-left px-3 py-1 hover:bg-gray-100"
                onClick={hidePin}
              >
                Hide
              </button>
              <button
                className="block w-full text-left px-3 py-1 hover:bg-gray-100 text-red-600"
                onClick={reportPin}
              >
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media (carousel preferred) */}
      {gallery.length > 0 ? (
        <Carousel
          items={gallery}
          onOpenLightbox={(src) => {
            setLightboxSrc(src);
            setLightboxOpen(true);
          }}
        />
      ) : media_url ? (
        <div className="mb-2 overflow-hidden rounded-lg border">
          <button
            type="button"
            onClick={() => {
              setLightboxSrc(media_url);
              setLightboxOpen(true);
            }}
            className="block w-full focus:outline-none"
          >
            {singleMediaType === "video" ? (
              <video
                src={media_url}
                className="w-full h-[140px] object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={media_url}
                alt={note || "pin media"}
                className="w-full h-[140px] object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )}
          </button>
        </div>
      ) : null}

      {/* Note */}
      {note && (
        <div className="text-sm text-neutral-800 my-2 whitespace-pre-wrap break-words">
          {note}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canVote}
          onClick={() => handleVote(1)}
          className={[
            "px-2 py-1 rounded-lg border text-sm",
            myVote === 1
              ? "bg-black text-white border-black"
              : "bg-white border-neutral-300 hover:bg-black/5",
            !canVote ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
          title={canVote ? "Like" : "Sign in to vote"}
        >
          👍 <span className="ml-1">{up}</span>
        </button>
        <button
          type="button"
          disabled={!canVote}
          onClick={() => handleVote(-1)}
          className={[
            "px-2 py-1 rounded-lg border text-sm",
            myVote === -1
              ? "bg-black text-white border-black"
              : "bg-white border-neutral-300 hover:bg-black/5",
            !canVote ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
          title={canVote ? "Dislike" : "Sign in to vote"}
        >
          👎 <span className="ml-1">{down}</span>
        </button>
        {views !== null && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs bg-white">
            👀 {views}
          </span>
        )}
      </div>

      {/* Rating */}
      <RatingStars pinId={id} userId={uid} />

      {/* Comments */}
      <CommentsSection pinId={id} userId={uid} />

      {/* Lightbox */}
      {lightboxOpen && (
        <MediaLightbox
          type={/\.(mp4|webm|ogg)$/i.test(lightboxSrc) ? "video" : "image"}
          src={lightboxSrc}
          alt={note || "pin media"}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Profile modal */}
      <InlineProfileCard
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={{
          id: authorId,
          display_name: authorName,
          username: authorUsername,
          photo_url: authorPhoto,
          bio: authorBio,
          postsCount: authorPostsCount ?? 0,
          notesCount: authorNotesCount ?? 0,
        }}
      />
    </div>
  );
}
