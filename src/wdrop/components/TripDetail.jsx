import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTripById } from "../lib/trips.js";
import ItineraryDay from "./ItineraryDay.jsx";

/**
 * TripDetail.jsx
 * - Full detail page for a trip.
 * - Shows trip header (title, description, start date) and the day-by-day itinerary.
 */
export default function TripDetail() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getTripById(id);
        if (mounted) setTrip(data);
      } catch (e) {
        if (mounted) setError(e.message || "Failed to load trip");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="p-4">Loading trip…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!trip) return <div className="p-4">Trip not found.</div>;

  const start = trip.start_date
    ? new Date(trip.start_date).toLocaleDateString()
    : null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Trip header */}
      <h1 className="text-2xl font-bold">{trip.title}</h1>
      {start && <div className="text-gray-500 text-sm mb-2">Start: {start}</div>}
      {trip.description && (
        <p className="text-gray-700 mb-4">{trip.description}</p>
      )}

      {/* Itinerary */}
      <div>
        {trip.days && trip.days.length > 0 ? (
          trip.days.map((day, idx) => (
            <ItineraryDay key={idx} day={idx} stops={day.stops || []} />
          ))
        ) : (
          <div className="text-sm text-gray-500">No itinerary added yet.</div>
        )}
      </div>
    </div>
  );
}
