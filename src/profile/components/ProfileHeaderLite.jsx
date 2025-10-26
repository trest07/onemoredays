import { Link } from "react-router-dom";
import Badge from "../../components/Badge.jsx";
import UserLink from "@/profile/components/userlink.jsx";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAlert } from "../../context/AlertContext.jsx";

export default function ProfileHeaderLite({ profile, isOwner }) {
  const [userId, setUserId] = useState("");
  const [profileId, setProfileId] = useState(profile.id);
  const [loading, setLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState("none");
  const [followersCount, setFollowersCount] = useState(
    profile.followers_count || 0
  );
  const [followingCount, setFollowingCount] = useState(
    profile.following_count || 0
  );
  const { loggedUser } = useAuth();
  const { showAlert } = useAlert();

  const bannerUrl = profile.banner_url || "/default-banner.jpg";
  const avatarUrl = profile.photo_url || "/avatar.jpg";

  useEffect(() => {
    const loadFollowStatus = async () => {
      const userIdNew = loggedUser?.id;
      setUserId(userIdNew);

      const { data } = await supabase
        .schema("omd")
        .from("follow_requests")
        .select("status")
        .eq("follower_id", userIdNew)
        .eq("followed_id", profileId)
        .maybeSingle();

      if (data?.status === "accepted") setFollowStatus("following");
      else if (data?.status === "pending") setFollowStatus("requested");
      else setFollowStatus("none");
    };

    loadFollowStatus();
  }, [profileId]);

  const handleFollowClick = async () => {
    if (!userId)
      //return alert("You must be logged in.");
      showAlert({ message: "You must be logged in.", type: "warning" });

    setLoading(true);
    try {
      if (followStatus === "none") {
        // Send request
        await supabase.schema("omd").from("follow_requests").insert({
          follower_id: userId,
          followed_id: profileId,
          status: "pending",
        });
        setFollowStatus("requested");
      } else if (followStatus === "requested") {
        // Cancel request
        await supabase
          .schema("omd")
          .from("follow_requests")
          .delete()
          .eq("follower_id", userId)
          .eq("followed_id", profileId)
          .eq("status", "pending");
        setFollowStatus("none");
      } else if (followStatus === "following") {
        // ⚠️ Optional: Unfollow
        await supabase
          .schema("omd")
          .from("follow_requests")
          .delete()
          .eq("follower_id", userId)
          .eq("followed_id", profileId)
          .eq("status", "accepted");
        setFollowStatus("none");
        setFollowersCount((count) => count - 1);
      }
    } catch (err) {
      console.error("Follow action error:", err);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Follow Button */}
        {userId !== profile.id && (
          <button
            type="button"
            disabled={loading}
            onClick={handleFollowClick}
            className={`
        px-4 py-1.5 ml-4 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm
        ${
          followStatus === "none" //gradient-to-b from-[#E45A12] to-[#8E1E1E]
            ? "bg-gray-800 text-white hover:opacity-90"
            : followStatus === "requested"
            ? "bg-neutral-100 border border-neutral-300 text-neutral-600 hover:bg-neutral-200"
            : "bg-white border border-neutral-400 text-neutral-800 hover:bg-neutral-50"
        }
      `}
          >
            {loading
              ? "..."
              : followStatus === "none"
              ? "Follow"
              : followStatus === "requested"
              ? "Requested"
              : "Following"}
          </button>
        )}

        {/* Edit button if owner */}
        {isOwner && (
          <Link
            to="/settings"
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
        <span>{followersCount} followers</span>
        <span>{followingCount} following</span>
        <span>{profile.drops_count ?? 0} drops</span>
        {profile.trips_count !== undefined && (
          <span>{profile.trips_count} trips</span>
        )}
      </div>
    </div>
  );
}
