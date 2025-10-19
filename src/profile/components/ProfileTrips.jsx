import React from "react";
import { useTripsByProfile } from "../../wdrop/hooks/useTrips.js";
import TripList from "../../wdrop/components/TripList.jsx";

/**
 * ProfileTrips
 * - Displays a list of trips for the given profile.
 * - Uses the TripBFF hooks and TripList component.
 */
export default function ProfileTrips({ profileId, isOwner }) {
  const { trips, loading, error } = useTripsByProfile(profileId);

  if (loading) {
    return <div className="p-4">Loading trips…</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        No trips yet.
        {isOwner && (
          <div className="mt-3">
            <a
              href={`/trips/new?owner=${profileId}`}
              className="inline-block px-3 py-2 rounded bg-black text-white text-sm"
            >
              Create your first trip
            </a>
          </div>
        )}
      </div>
    );
  }

  return <TripList trips={trips} allowCreate={isOwner} ownerId={profileId} />;
}
