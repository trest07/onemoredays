import React from "react"
import { useMyProfile } from "@/hooks/useMyProfile"
import ProfileCard from "@/components/ProfileCard"

export default function MyProfile() {
  const { profile, loading, error } = useMyProfile()

  if (loading) {
    return (
      <div className="grid place-items-center min-h-[60vh]">
        <div className="px-3 py-2 rounded-lg bg-white/90 border shadow text-sm">Loading…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-red-600">
        Failed to load profile: {error.message}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-gray-600">
        Not signed in.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <ProfileCard
  name={profile.display_name || "Unnamed"}
  username={profile.username || profile.id?.slice(0, 8)}
  photoUrl={profile.photo_url || undefined}
  subtitle={profile.bio || "Member"}
  postsCount={profile.posts_count || 0}   // 👈 wire your db field
  notesCount={profile.notes_count || 0}   // 👈 wire your db field
  actionLabel={null}
  onClick={() => console.log("open profile", profile.id)}
/>

    </div>
  )
}
