import React, { useEffect, useState } from "react";
import { fetchTripById, fetchStopsForTrip, addStop } from "@/trips/lib/trips";
import { useParams, useNavigate } from "react-router-dom";
import ItineraryDay from "./ItineraryDay";
import { supabase } from "@/supabaseClient";
import Loading from "../../components/Loading";

export default function TripDetail() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const t = await fetchTripById(id);
        setTrip(t);
        const s = await fetchStopsForTrip(id);
        setStops(s || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleAddStop(dayIndex = 0) {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return alert("Login required");
    try {
      const newStop = await addStop({
        trip_id: id,
        day_index: dayIndex,
        order_index: stops.filter((s) => s.day_index === dayIndex).length || 0,
        title: "New stop",
      });
      setStops((prev) => [...prev, newStop]);
    } catch (e) {
      console.error(e);
      alert("Failed to add stop");
    }
  }

  async function handleAddDay() {
    const currentMaxDay = stops.length
      ? Math.max(...stops.map((s) => s.day_index))
      : -1;
    const nextDay = currentMaxDay + 1;
    await handleAddStop(nextDay);
  }

  if (loading) return <Loading/>;
  if (!trip) return <div>Trip not found or access denied.</div>;

  // group stops by dayIndex
  const days = {};
  stops.forEach((s) => {
    (days[s.day_index] = days[s.day_index] || []).push(s);
  });
  const dayIndexes = Object.keys(days).sort((a, b) => a - b);

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Trip header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 flex gap-10">
          {/* Image + title */}
          {trip.image_url ? (
            <img
              src={trip.image_url}
              alt={trip.title}
              className="h-60 w-80 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="h-40 w-40 bg-neutral-100 rounded-lg grid place-items-center text-neutral-400 flex-shrink-0">
              No image
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{trip.title}</h2>
            <div className="text-sm text-neutral-600 mt-1">
              {trip.description}
            </div>
            {trip.start_date && (
              <div className="text-xs text-neutral-500 mt-1">
                {trip.start_date} → {trip.end_date || ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stops */}
      <div className="mt-4 space-y-3">
        {/* Add Day */}
        <button
          onClick={handleAddDay}
          className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white"
        >
          Add Day
        </button>
        {dayIndexes.length === 0 ? (
          <div className="text-sm text-neutral-500">
            No stops yet.
            <button
              onClick={() => handleAddStop(0)}
              className="ml-2 text-amber-600"
            >
              Add first stop
            </button>
          </div>
        ) : (
          dayIndexes.map((di) => (
            <ItineraryDay
              key={di}
              dayIndex={Number(di)}
              stops={days[di]}
              onAddStop={() => handleAddStop(Number(di))}
              refreshStops={async () => {
                const s = await fetchStopsForTrip(id);
                setStops(s || []);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
