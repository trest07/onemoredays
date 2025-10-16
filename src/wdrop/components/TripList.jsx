import React from "react";
import { Link } from "react-router-dom";
import TripCard from "./TripCard.jsx";

/**
 * TripList.jsx
 * - Renders a responsive grid of TripCard items.
 * - Props:
 *    - trips: Array of trip objects
 *    - allowCreate: boolean (show "Create trip" action)
 *    - ownerId: string (used to prefill owner in create link)
 *    - header: optional string title above the grid
 */
export default function TripList({ trips = [], allowCreate = false, ownerId, header }) {
  if (!trips.length) {
    return (
      <div className="p-4 border rounded bg-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Trips</h3>
          {allowCreate && (
            <Link
              to={`/trips/new?owner=${ownerId ?? ""}`}
              className="text-sm px-3 py-1 rounded bg-black text-white"
            >
              Create trip
            </Link>
          )}
        </div>
        <div className="mt-3 text-sm text-gray-500">No trips yet.</div>
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="font-semibold">{header || "Trips"}</h3>
        {allowCreate && (
          <Link
            to={`/trips/new?owner=${ownerId ?? ""}`}
            className="text-sm px-3 py-1 rounded bg-black text-white"
          >
            Create trip
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {trips.map((t) => (
          <TripCard key={t.id} trip={t} />
        ))}
      </div>
    </section>
  );
}
