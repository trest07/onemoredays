import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

export default function CommentsSection({ pinId, userId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // load comment count
  useEffect(() => {
    if (pinId) fetchCount();
  }, [pinId]);

  async function fetchCount() {
    const { count, error } = await supabase
      .schema("omd")
      .from("pin_comments")
      .select("*", { count: "exact", head: true })
      .eq("pin_id", pinId);

    if (!error && count !== null) setCount(count);
  }

  // load comments when expanded
  useEffect(() => {
    if (expanded && pinId) loadComments();
  }, [expanded, pinId]);

  async function loadComments() {
    setLoading(true);

    try {
      const { data: commentsData, error: commentsError } = await supabase
        .schema("omd")
        .from("pin_comments")
        .select("id, user_id, body, created_at")
        .eq("pin_id", pinId)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(commentsData.map((c) => c.user_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, photo_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const profilesMap = Object.fromEntries(
        profilesData.map((p) => [p.id, p])
      );
      const commentsWithProfiles = commentsData.map((c) => ({
        ...c,
        profile: profilesMap[c.user_id] || {
          username: "Anonymous",
          avatar_url: "/avatar.jpg",
        },
      }));

      setComments(commentsWithProfiles);
    } catch (e) {
      console.error(e);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  async function postComment() {
    if (!userId) return alert("Log in to comment");
    if (!text.trim()) return;

    const { error } = await supabase.schema("omd").from("pin_comments").insert({
      pin_id: pinId,
      user_id: userId,
      body: text.trim(),
    });

    if (!error) {
      setText("");
      setCount((prev) => prev + 1); // 🆕 update count
      loadComments();
    } else {
      console.error(error);
    }
  }

  return (
    <div className="mt-2 border-t pt-2">
      {/* Button expand*/}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        {expanded ? "Hide comments" : "View comments"}
      </button>
      {!expanded && count > 0 && (
        <p className="text-xs text-neutral-500 mt-1">
          {count} comment{count !== 1 && "s"}
        </p>
      )}

      {/* Section expanded */}
      {expanded && (
        <div className="mt-1 space-y-2 transition-all">
          {loading ? (
            <p className="text-sm text-neutral-500">Load comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-neutral-500">
              There are no comments yet.
            </p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  <img
                    src={c.profile.photo_url || "/avatar.jpg"}
                    alt={c.profile.username}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-neutral-800">
                      {c.profile.username || "Anon"}
                    </div>
                    <div className="text-neutral-700">{c.body}</div>
                    <div className="text-[11px] text-neutral-400">
                      {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* box to write comments*/}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 border rounded-lg px-2 py-1 text-sm"
            />
            <button
              onClick={postComment}
              className="text-sm bg-black text-white px-3 py-1 rounded-lg hover:bg-neutral-800"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
