import { Link } from "react-router-dom";
import Badge from "../../components/Badge.jsx";
import UserLink from "@/profile/components/userlink.jsx";

export default function ProfileHeaderLite({ profile, isOwner }) {
  const bannerUrl = profile.banner_url || "/default-banner.jpg";
  const avatarUrl = profile.photo_url || "/avatar.jpg";

  return (
    <div className="border-b bg-white">
      {/* Banner */}
      <div className="relative w-full h-32 sm:h-40 bg-gray-200 overflow-hidden rounded-b-lg">
        <img
          src={bannerUrl}
          alt="Profile banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header content */}
      <div className="p-4 -mt-10 flex items-end gap-3">
        {/* Avatar + name */}
        <UserLink
          userId={profile.id}
          username={profile.username}
          avatarUrl={avatarUrl}
          avatarSize={64}
          className="flex items-center gap-3"
        >
          {/* Avatar */}
          <div className="relative">
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow"
            />
          </div>

          {/* Name / username */}
          <div className="flex-1">
            <div className="text-lg font-semibold leading-tight mt-4">
              {profile.display_name || profile.username || "User"}
            </div>
            <div className="text-xs text-gray-500">@{profile.username}</div>

            {/* Badges */}
            <div className="flex gap-2 mt-1">
              {profile.is_driver && <Badge text="Driver" />}
              {profile.is_vendor && <Badge text="Vendor" />}
            </div>
          </div>
        </UserLink>

        {/* Edit button if owner */}
        {isOwner && (
          <Link
            to="/profile/edit"
            className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
          >
            Edit
          </Link>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="px-4 text-sm text-gray-700 mb-3">{profile.bio}</p>
      )}

      {/* Stats */}
      <div className="px-4 pb-3 text-xs text-gray-600 flex gap-4">
        <span>{profile.followers_count ?? 0} followers</span>
        <span>{profile.following_count ?? 0} following</span>
        <span>{profile.drops_count ?? 0} drops</span>
        {profile.trips_count !== undefined && (
          <span>{profile.trips_count} trips</span>
        )}
      </div>
    </div>
  );
}
