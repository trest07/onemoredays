import { Link } from "react-router-dom";
import Badge from "../../components/Badge.jsx";

export default function ProfileHeaderLite({ profile, isOwner }) {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <img
          src={profile.avatar_url || "/avatar.png"}
          alt="avatar"
          className="w-16 h-16 rounded-full object-cover"
        />

        {/* Name / username */}
        <div className="flex-1">
          <div className="text-lg font-semibold">
            {profile.display_name || profile.username || "User"}
          </div>
          <div className="text-xs text-gray-500">@{profile.username}</div>

          {/* Example: show badge if driver or vendor */}
          {profile.is_driver && <Badge text="Driver" />}
          {profile.is_vendor && <Badge text="Vendor" />}
        </div>

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
        <p className="mt-3 text-sm text-gray-700">{profile.bio}</p>
      )}

      {/* Stats */}
      <div className="mt-3 text-xs text-gray-600 flex gap-4">
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
