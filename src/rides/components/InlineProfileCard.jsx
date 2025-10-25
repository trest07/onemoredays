// src/rides/components/InlineProfileCard.jsx
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import ProfileCard from "../../components/ProfileCard";

export default function InlineProfileCard({ open, profile, onClose }) {
  const containerRef = useRef(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus the dialog for accessibility
  useEffect(() => {
    if (open) containerRef.current?.focus?.();
  }, [open]);

  if (!open) return null;

  const username = profile?.username;
  const profileHref =
    username && username.length
      ? `/profile/${encodeURIComponent(username.replace(/^@/, ""))}`
      : profile?.id
      ? `/profile/${encodeURIComponent(profile.id)}`
      : "/profile";

  const dialog = (
    <div
      className="fixed inset-0 z-[3000] grid place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Profile"
      ref={containerRef}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card container */}
      <div
        className="relative z-[3001] w-[min(560px,92vw)]"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <ProfileCard
          name={profile?.display_name || "Unnamed"}
          username={
            profile?.username ||
            (profile?.id ? profile.id.slice(0, 8) : undefined)
          }
          photoUrl={profile?.photo_url || undefined}
          subtitle={profile?.bio || "Member"}
          postsCount={profile?.postsCount ?? 0}
          notesCount={profile?.notesCount ?? 0}
          profileId={profile?.id}
          actionLabel="Close"
          onAction={onClose}
          onClick={onClose}
        />

        {/* Optional: small link to full profile page */}
        <div className="mt-2 flex justify-end">
          <Link
            to={profileHref}
            className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
            onClick={onClose}
          >
            View full profile →
          </Link>
        </div>
      </div>
    </div>
  );

  // Render via portal to avoid stacking/positioning issues
  return createPortal(dialog, document.body);
}
