import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/tabs";
import InlineProfileCard from "../../rides/components/InlineProfileCard";
import Loading from "../../components/Loading";
import { useAuth } from "../../context/AuthContext";

// Simple card for a user
function UserCard({
  user,
  onAccept,
  onRemove,
  onFollow,
  loading,
  userId,
  setLoading,
  isOwner = true,
}) {
  const [followStatus, setFollowStatus] = useState("none");
  const [profileOpen, setProfileOpen] = useState(false);
  // const [userId, setUserId] = useState("");
  const [loggedUserId, setLoggedUserId] = useState(null);

  const { loggedUser } = useAuth();
  useEffect(() => {
    const loadFollowStatus = async () => {
      // const { data: userData } = await supabase.auth.getUser();
      const userIdNew = loggedUser?.id;
      setLoggedUserId(userIdNew);

      const { data } = await supabase
        .schema("omd")
        .from("follow_requests")
        .select("status")
        .eq("follower_id", userId)
        .eq("followed_id", user.request_id || user.id)
        .maybeSingle();

      if (data?.status === "accepted") setFollowStatus("following");
      else if (data?.status === "pending") setFollowStatus("requested");
      else setFollowStatus("none");
    };

    if (onFollow) loadFollowStatus();
  }, []);

  // Handle follow/unfollow
  const handleFollowClick = async () => {
    if (!userId) return alert("You must be logged in.");

    setLoading(true);
    try {
      if (followStatus === "none") {
        // Send request
        await supabase
          .schema("omd")
          .from("follow_requests")
          .insert({
            follower_id: userId,
            followed_id: user.request_id || user.id,
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
          .eq("followed_id", user.request_id || user.id)
          .eq("status", "pending");
        setFollowStatus("none");
      } else if (followStatus === "following") {
        // Optional: Unfollow
        await supabase
          .schema("omd")
          .from("follow_requests")
          .delete()
          .eq("follower_id", userId)
          .eq("followed_id", user.request_id || user.id)
          .eq("status", "accepted");
        setFollowStatus("none");
      }
    } catch (err) {
      console.error("Follow action error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 shadow rounded-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-2 focus:outline-none"
        >
          <img
            src={user.avatar_url || "/avatar.jpg"}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-sm">{user.username}</p>
            {user.status && (
              <p className="text-xs text-neutral-500">{user.status}</p>
            )}
          </div>
        </button>
      </div>
      <div className="flex justify-between p-2 border-b gap-4">
        {onAccept && (
          <button
            onClick={() => onAccept(user)}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Accept
          </button>
        )}
        {onFollow && user.id !== loggedUserId && (
          <button
            type="button"
            disabled={loading}
            onClick={handleFollowClick}
            className={`
        px-4 py-1 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm
        ${
          followStatus === "none"
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
        {onRemove && isOwner && (
          <button
            onClick={() => onRemove(user)}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Remove
          </button>
        )}
      </div>

      {/* Profile modal */}
      <InlineProfileCard
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={{
          id: user.id,
          display_name: user.display_name || user.username,
          username: user.username,
          photo_url:
            user.avatar_url ||
            user.profiles?.avatar_url ||
            user.photo_url ||
            "/avatar.jpg",
          bio: user.bio || "",
        }}
      />
    </div>
  );
}

export default function ConnectionsTab({ profileId, isOwner = true }) {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [userId, setUserId] = useState(profileId || "");

  const { loggedUser } = useAuth();
  useEffect(() => {
    (async () => {
      try {
        let user;
        if (!userId) {
          // const { data: userData, error: userErr } =
          //   await supabase.auth.getUser();

          // if (userErr) throw userErr;
          user = loggedUser;
        } else {
          user = { id: userId };
        }
        if (user?.id) {
          setUserId(user.id);
          loadConnections(user?.id);
        }
      } catch (e) {
        setErr(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadConnections(userId) {
    setLoading(true);

    const { data: followersData, error: followersErr } = await supabase
      .schema("omd")
      .from("follow_requests")
      .select("follower_id, status")
      .eq("followed_id", userId);

    const { data: followingData, error: followingErr } = await supabase
      .schema("omd")
      .from("follow_requests")
      .select("followed_id, status")
      .eq("follower_id", userId);

    // Collect all user IDs to fetch profiles
    const followerIds = followersData.map((f) => f.follower_id);
    const followingIds = followingData.map((f) => f.followed_id);
    const allIds = Array.from(new Set([...followerIds, ...followingIds])); // remove duplicates

    // Fetch profiles for all IDs
    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("id, username, photo_url")
      .in("id", allIds);

    // Map profile info to followers/following
    const profilesMap = profiles.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const enrichedFollowers = followersData.map((f) => ({
      ...f,
      profile: profilesMap[f.follower_id] || null,
    }));

    const enrichedFollowing = followingData.map((f) => ({
      ...f,
      profile: profilesMap[f.followed_id] || null,
    }));

    // Requests → pending ones for me to accept
    const pending =
      enrichedFollowers?.filter((r) => r.status === "pending") || [];

    setFollowers(
      enrichedFollowers
        ?.filter((r) => r.status === "accepted")
        ?.map((r) => ({
          ...r.profile,
          status: "Follower",
        })) || []
    );

    setFollowing(
      enrichedFollowing
        ?.filter((r) => r.status === "accepted")
        ?.map((r) => ({
          ...r.profile,
          status: "Following",
        })) || []
    );

    setRequests(
      pending.map((r) => ({
        ...r.profile,
        request_id: r.follower_id,
      })) || []
    );

    setLoading(false);
  }

  async function handleAccept(user) {
    const { error } = await supabase
      .schema("omd")
      .from("follow_requests")
      .update({ status: "accepted" })
      .eq("follower_id", user.request_id || user.id)
      .eq("followed_id", userId);
    if (!error) await loadConnections(userId);
  }

  async function handleRemove(user) {
    const { error } = await supabase
      .schema("omd")
      .from("follow_requests")
      .delete()
      .eq("follower_id", user.request_id || user.id)
      .eq("followed_id", userId);
    if (!error) loadConnections(userId);
  }

  async function handleRemoveFollowing(user) {
    const { error } = await supabase
      .schema("omd")
      .from("follow_requests")
      .delete()
      .eq("followed_id", user.request_id || user.id)
      .eq("follower_id", userId);
    if (!error) loadConnections(userId);
  }

  if (loading) return <Loading />;

  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <Tabs defaultValue="followers">
        <TabsList className="flex justify-around bg-neutral-100 rounded-lg mb-3">
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          {isOwner && <TabsTrigger value="requests">Requests</TabsTrigger>}
        </TabsList>

        <TabsContent value="followers">
          {followers.length ? (
            followers.map((f) => (
              <UserCard
                key={f.username}
                user={f}
                onFollow={true}
                setLoading={setLoading}
                userId={userId}
                loading={loading}
                onRemove={handleRemove}
                isOwner={isOwner}
              />
            ))
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">
              No followers yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="following">
          {following.length ? (
            following.map((f) => (
              <UserCard
                key={f.username}
                user={f}
                onRemove={handleRemoveFollowing}
                isOwner={isOwner}
              />
            ))
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">
              Not following anyone yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {requests.length ? (
            requests.map((r) => (
              <UserCard
                key={r.username}
                user={r}
                onAccept={handleAccept}
                onRemove={handleRemove}
                isOwner={isOwner}
              />
            ))
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">
              No pending requests.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
