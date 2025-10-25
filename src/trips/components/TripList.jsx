import React, { useEffect, useState } from "react";
import { fetchTrips, deleteTrip } from "@/trips/lib/trips";
import TripCard from "./TripCard";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";

export default function TripList() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchTrips({ limit: 100 });
        setTrips(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleEdit(trip) {
    navigate("/trips/new", { state: { trip } });
  }

  async function handleDelete(tripId) {
    if (!confirm("Delete this trip?")) return;
    try {
      deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) {
      alert("Failed to delete trip: " + err.message);
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Trips</h2>
        <button
          onClick={() => navigate("/trips/new")}
          className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white"
        >
          New Trip
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-3">
          {trips.map((t) => (
            <TripCard
              key={t.id}
              trip={t}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
