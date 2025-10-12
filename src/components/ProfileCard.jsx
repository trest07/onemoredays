import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import { fetchMyDropsWithStats } from "@/rides/lib/drops";
import { Item } from "../rides/pages/settings/MyDrops";

/** Small helper: initials from a name */
function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

const emberGrad = "linear-gradient(180deg, #E45A12 0%, #8E1E1E 100%)";

export default function ProfileCard({
  name,
  username,
  photoUrl,
  subtitle,
  postsCount = 0, // 📷
  notesCount = 0, // 📝
  profileId, // the profile being shown
  actionLabel = "View",
  onAction,
  onClick,
}) {
  const [followStatus, setFollowStatus] = useState("none"); // none | requested | following
  const [photos, setPhotos] = useState([]);
  const [showPhotos, setShowPhotos] = useState(false);
  const [photosCount, setPhotosCount] = useState(postsCount);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [drops, setDrops] = useState([]);
  const [showDrops, setShowDrops] = useState(false);

  const loadPhotos = async () => {
    if (!profileId) return;

    const { data, error } = await supabase
      .schema("omd")
      .rpc("get_photos_count", {
        uid: profileId,
      });
    if (error) console.error("Error fetching photo count:", error);
    setPhotosCount(data || 0);

    if (followStatus === "following" || profileId === userId) {
      const { data, error } = await supabase
        .schema("omd")
        .from("profile_photos")
        .select("url, caption")
        .eq("user_id", profileId);

      if (error) console.error("Error fetching photos:", error);
      setPhotos(data || []);
    } else {
      setPhotos([]);
    }

    loadDrops();
  };

  useEffect(() => {
    const loadFollowStatus = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userIdNew = userData?.user?.id;
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

  const loadDrops = async () => {
    try {
      setLoading(true);
      if (!profileId) {
        setDrops([]);
        return;
      }
      const data = await fetchMyDropsWithStats({ userId: profileId });
      setDrops(data ?? []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileId) return;
    loadPhotos();
  }, [profileId, followStatus, userId]);

  // Load photos only if user is following and clicks camera
  const handleShowPhotos = async () => {
    if (followStatus !== "following" && profileId !== userId) return;

    if (photos.length > 0) {
      setShowPhotos((prev) => !prev);
      return;
    }

    setShowPhotos(true);
  };

  const handleShowDrops = async () => {
    if (drops.length > 0) {
      setShowDrops((prev) => !prev);
      return;
    }

    setShowDrops(true);
  };

  // Handle follow/unfollow
  const handleFollowClick = async () => {
    if (!userId) return alert("You must be logged in.");

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
      }
    } catch (err) {
      console.error("Follow action error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="group w-full max-w-xl select-none rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      style={{
        border: "1px solid transparent",
        backgroundImage: `linear-gradient(white, white), ${emberGrad}`,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name || "profile"}
              className="h-16 w-16 rounded-xl object-cover border"
            />
          ) : (
            <div
              className="h-16 w-16 rounded-xl grid place-items-center text-white font-semibold"
              style={{ background: emberGrad }}
            >
              {initials(name)}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border bg-white grid place-items-center">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: "#22c55e" }}
            />
          </span>
        </div>

        {/* Texts */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {name}
            </h3>
          </div>
          {username ? (
            <div className="text-sm text-gray-500 truncate">
              {username.startsWith("@") ? username : `@${username}`}
            </div>
          ) : null}
          {subtitle ? (
            <div className="mt-0.5 text-xs text-gray-500 truncate">
              {subtitle}
            </div>
          ) : null}
          {/* Stats */}
          <div className="mt-2 flex gap-4 text-xs text-gray-700">
            <span
              className="inline-flex items-center gap-1.5 cursor-pointer shadow rounded-full px-2 py-0.5 hover:bg-gray-100"
              onClick={handleShowPhotos}
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M9 3h6l1.5 2H21a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4.5L9 3Zm3 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                />
              </svg>
              <span>{photosCount}</span>
            </span>
            <span
              className="inline-flex items-center gap-1.5 cursor-pointer shadow rounded-full px-2 py-0.5 hover:bg-gray-100"
              onClick={handleShowDrops}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2C8.7 2 6 4.7 6 8c0 4.3 6 12 6 12s6-7.7 6-12c0-3.3-2.7-6-6-6Zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
                />
              </svg>
              <span>{drops.length}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 cursor-pointer shadow rounded-full px-2 py-0.5 hover:bg-gray-100">
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M19 3H8a2 2 0 0 0-2 2v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-3 14H5V9h11Zm3-4h-1V7a2 2 0 0 0-2-2H8V5h11Z"
                />
              </svg>
              <span>{notesCount}</span>
            </span>
          </div>
        </div>

        {/* Follow Button */}
        {userId !== profileId && (
          <button
            type="button"
            disabled={loading}
            onClick={handleFollowClick}
            className={`
        px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm
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

        {/* Action */}
        {actionLabel ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.();
            }}
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 transition-all"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {/* Photos grid */}
      <AnimatePresence>
        {showPhotos && photos.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3 }}
              className="my-2 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent"
            />
            <motion.div
              className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1 rounded-lg bg-gray-50 scroll-smooth scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
                >
                  <img
                    src={p.url}
                    alt={`Photo ${i + 1}`}
                    className="object-cover w-full h-full"
                  />
                  {p.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                      {p.caption}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Drops */}
      <AnimatePresence>
        {showDrops && drops.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3 }}
              className="my-2 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent"
            />
            <motion.div
              className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto p-1 rounded-lg bg-gray-50 scroll-smooth scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {drops.map((d) => (
                <Item key={d.id} d={d} userId={userId} />
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
