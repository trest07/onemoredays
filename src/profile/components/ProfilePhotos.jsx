// src/components/PhotoGallery.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabaseClient";
import {
  uploadToCloudflare,
  compressImageFile,
} from "@/lib/uploadToCloudflare";
import Loading from "../../components/Loading";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";

export default function ProfilePhotos({ profile, isOwner = true }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [user, setUser] = useState(profile);
  const { showAlert, showConfirm } = useAlert();

  // auth
  const { loggedUser } = useAuth();
  useEffect(() => {
    (async () => {
      if (user?.id) return;
      // const { data } = await supabase.auth.getUser();
      if (loggedUser) setUser(loggedUser);
    })();
  }, []);

  // load photos
  useEffect(() => {
    if (!user?.id) return;
    loadPhotos();
  }, [user]);

  async function loadPhotos() {
    setLoading(true);
    const { data, error } = await supabase
      .schema("omd")
      .from("profile_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setPhotos(data || []);
    setLoading(false);
  }

  // handle file selection
  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file || !user?.id) return;
    try {
      setUploading(true);
      const compressed = await compressImageFile(file, 1280, 0.82);
      const key = `omd/profile_photos/${user.id}/${Date.now()}-${file.name}`;
      const { url, error } = await uploadToCloudflare(compressed, key);
      if (error) throw new Error(error);

      const { error: insertErr } = await supabase
        .schema("omd")
        .from("profile_photos")
        .insert({ user_id: user.id, url: url, caption });
      if (insertErr) throw insertErr;

      setCaption("");
      setFile(null);
      setPreview("");
      await loadPhotos();
    } catch (err) {
      // alert("Error uploading: " + err.message);
      showAlert({
        message: "Error uploading: " + err.message,
        type: "warning",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    // if (!window.confirm("Delete this photo?")) return;
    showConfirm({
      message: "Delete this photo?",
      onConfirm: async () => {
        const { error } = await supabase
          .schema("omd")
          .from("profile_photos")
          .delete()
          .eq("id", id);
        if (!error) setPhotos((p) => p.filter((x) => x.id !== id));
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        {isOwner && (
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">My Photos</h2>
            {/* <label className="cursor-pointer bg-black text-white px-3 py-1 rounded-xl hover:bg-gray-800 transition">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label> */}
            <label className="flex items-center gap-2 cursor-pointer bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition shadow-sm active:scale-95">
              {/* <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M12 5v14M5 12h14" />
            </svg> */}
              <span className="text-sm font-medium">Upload</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          </div>
        )}

        {/* Upload modal */}
        <AnimatePresence>
          {file && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-xl p-6 w-96 max-w-[90%]"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="rounded-xl w-full h-64 object-cover mb-4 border"
                />
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="w-full border rounded-xl p-2 text-sm focus:ring focus:ring-amber-300"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview("");
                      setCaption("");
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:opacity-90 transition"
                  >
                    {uploading ? "Uploading…" : "Post"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery */}
        {loading ? (
          <Loading />
        ) : photos.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">No photos yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((p) => (
              <motion.div
                key={p.id}
                layout
                className="relative group overflow-hidden rounded-md border bg-white shadow-sm"
              >
                <img
                  src={p.url}
                  alt={p.caption || ""}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                />
                {p.caption && (
                  <div className="p-2 text-xs text-gray-700 truncate">
                    {p.caption}
                  </div>
                )}
                {isOwner && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1 shadow transition opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H3.5a.5.5 0 000 1H4v11a2 2 0 002 2h8a2 2 0 002-2V5h.5a.5.5 0 000-1H15V3a1 1 0 00-1-1H6zm2 4a.5.5 0 011 0v8a.5.5 0 01-1 0V6zm4 0a.5.5 0 011 0v8a.5.5 0 01-1 0V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
