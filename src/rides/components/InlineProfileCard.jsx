// src/rides/components/InlineProfileCard.jsx
import React from "react"
import ProfileCard from "../../components/ProfileCard" // ✅ fixed: relative path to src/components/ProfileCard.jsx

// Centered overlay that shows a single ProfileCard
export default function InlineProfileCard({ open, profile, onClose }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[3000] grid place-items-center"
      aria-modal="true"
      role="dialog"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* card */}
      <div className="relative z-[3001] w-[min(560px,92vw)]">
        <ProfileCard
          name={profile?.display_name || "Unnamed"}
          username={profile?.username || (profile?.id ? profile.id.slice(0, 8) : undefined)}
          photoUrl={profile?.photo_url || undefined}
          subtitle={profile?.bio || "Member"}
          postsCount={profile?.postsCount ?? 0}
          notesCount={profile?.notesCount ?? 0}
          profileId={profile?.id}
          actionLabel="Close"
          onAction={onClose}
          onClick={onClose}
        />
      </div>
    </div>
  )
}
