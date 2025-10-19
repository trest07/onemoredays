import { useEffect, useState } from "react";
import { listTripsByProfile, getTripById } from "../lib/trips.js";

/**
 * Hook: useTripsByProfile
 * - Fetch all trips for a given profileId.
 */
export function useTripsByProfile(profileId) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profileId) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const rows = await listTripsByProfile(profileId);
        if (mounted) setTrips(rows);
      } catch (e) {
        if (mounted) setError(e.message || "Failed to load trips");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [profileId]);

  return { trips, loading, error };
}

/**
 * Hook: useTrip
 * - Fetch one trip by id.
 */
export function useTrip(tripId) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tripId) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const data = await getTripById(tripId);
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
  }, [tripId]);

  return { trip, loading, error };
}
