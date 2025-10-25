import React, { useState, useEffect } from "react";
import { addTrip, updateTrip } from "@/trips/lib/trips";
import { supabase } from "@/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import { uploadToCloudflare, compressImageFile } from "@/lib/uploadToCloudflare";
import { useAuth } from "../../context/AuthContext";

export default function NewTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const editTrip = location.state?.trip || null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTrip) {
      setTitle(editTrip.title || "");
      setDescription(editTrip.description || "");
      setStartDate(editTrip.start_date || "");
      setEndDate(editTrip.end_date || "");
      setIsPrivate(editTrip.is_private || false);
      setPreview(editTrip.image_url || "");
    }
  }, [editTrip]);

  async function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const { loggedUser } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // const { data: user } = await supabase.auth.getUser();
      if (!loggedUser?.id) throw new Error("Not authenticated");

      let imageUrl = preview;
      if (file) {
        const compressed = await compressImageFile(file, 1280, 0.82);
        const key = `omd/trips/${user.user.id}/${Date.now()}-${file.name}`;
        const { url, error } = await uploadToCloudflare(compressed, key);
        if (error) throw new Error(error);
        imageUrl = url;
      }

      if (editTrip) {
        await updateTrip(editTrip.id, {
          title,
          description,
          start_date: startDate || null,
          end_date: endDate || null,
          is_private: isPrivate,
          image_url: imageUrl,
        });
        navigate(`/trips/${editTrip.id}`);
      } else {
        const trip = await addTrip({
          user_id: user.user.id,
          title,
          description,
          start_date: startDate || null,
          end_date: endDate || null,
          is_private: isPrivate,
          image_url: imageUrl,
        });
        navigate(`/trips/${trip.id}`);
      }
    } catch (err) {
      alert(err.message || "Failed to save trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">{editTrip ? "Edit Trip" : "Create Trip"}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Trip title"
          className="w-full border rounded-lg px-3 py-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full border rounded-lg px-3 py-2"
          rows={4}
        />
        <div className="mb-3">
          <input type="file" accept="image/*" onChange={handleFile} />
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-2 w-full rounded-lg object-cover max-h-60"
            />
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />{" "}
          Private
        </label>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-amber-500 text-white"
          >
            {loading ? "Saving…" : editTrip ? "Save Changes" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
