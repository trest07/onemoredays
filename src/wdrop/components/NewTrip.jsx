import React, { useState } from "react";
import { createTrip } from "../lib/trips.js";

/**
 * NewTrip.jsx
 * - Simple form to create a new trip (title, description, start date).
 * - Calls Supabase helper createTrip and returns the new trip object.
 */
export default function NewTrip({ ownerId, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const trip = await createTrip({
        owner_id: ownerId,
        title,
        description,
        start_date: startDate || null,
      });
      setTitle("");
      setDescription("");
      setStartDate("");
      if (onCreated) onCreated(trip);
    } catch (e) {
      setError(e.message || "Failed to create trip");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4 p-4 border rounded bg-white" onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold">Create a New Trip</h2>

      <div>
        <label className="block text-sm mb-1">Title</label>
        <input
          type="text"
          className="w-full border rounded p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Description</label>
        <textarea
          className="w-full border rounded p-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Start Date</label>
        <input
          type="date"
          className="w-full border rounded p-2"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Trip"}
        </button>
      </div>
    </form>
  );
}
