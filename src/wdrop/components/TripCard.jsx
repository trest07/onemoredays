import React from "react";
import { Link } from "react-router-dom";

/**
 * TripCard.jsx
 * - Compact card UI to display a trip in a list or grid.
 * - Accepts a `trip` object with { id, title, description, start_date, stops_count }.
 */
export default function TripCard({ trip }) {
  const start = trip.start_date
    ? new Date(trip.start_date).toLocaleDateString()
    : null;

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block border rounded-lg p-4 bg-white hover:shadow transition"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{trip.title || "Untitled trip"}</h3>
        {start && <span className="text-xs text-gray-500">{start}</span>}
      </div>

      {trip.description && (
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {trip.description}
        </p>
      )}

      <div className="mt-3 text-xs text-gray-500">
        {trip.stops_count ?? 0} stops
      </div>
    </Link>
  );
}
