// src/rides/components/TripsPanel.jsx
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fetchTrips, fetchStopsForTrip } from "@/trips/lib/trips";
import ItineraryDay from "./ItineraryDay";

export default function TripsPanel({ profileId, showTrips }) {
  const [trips, setTrips] = useState([]);
  const [stopsByTrip, setStopsByTrip] = useState({});
  const [expandedTripId, setExpandedTripId] = useState(null);

  const loadTrips = async () => {
    if (!profileId) return;
    try {
      const data = await fetchTrips({ userId: profileId });
      setTrips(data || []);
    } catch (err) {
      console.error("Error loading trips:", err);
    }
  };

  useEffect(() => {
    if (showTrips) loadTrips();
  }, [profileId, showTrips]);

  return (
    <AnimatePresence>
      {showTrips && trips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-2 space-y-2 max-h-80 overflow-y-auto p-1 rounded-lg bg-gray-50 scroll-smooth scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
        >
          {trips.map((trip) => {
            const stops = stopsByTrip[trip.id] || [];
            const days = {};
            stops.forEach((s) => (days[s.day_index] = days[s.day_index] || []).push(s));
            const dayIndexes = Object.keys(days).sort((a, b) => a - b);

            return (
              <div key={trip.id} className="border rounded-lg p-2 bg-gray-50 cursor-pointer">
                <div
                  className="flex items-center gap-2"
                  onClick={async () => {
                    if (expandedTripId === trip.id) setExpandedTripId(null);
                    else {
                      setExpandedTripId(trip.id);
                      if (!stopsByTrip[trip.id]) {
                        const s = await fetchStopsForTrip(trip.id);
                        setStopsByTrip((prev) => ({
                          ...prev,
                          [trip.id]: s || [],
                        }));
                      }
                    }
                  }}
                >
                  {trip.image_url ? (
                    <img
                      src={trip.image_url}
                      alt={trip.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg grid place-items-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold truncate">{trip.title}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {trip.start_date ? `${trip.start_date} → ${trip.end_date || ""}` : ""}
                    </div>
                  </div>
                  <div className="text-amber-600 text-xs">
                    {expandedTripId === trip.id ? "Hide details" : "View details"}
                  </div>
                </div>

                {expandedTripId === trip.id && dayIndexes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {dayIndexes.map((di) => (
                      <ItineraryDay
                        key={di}
                        dayIndex={Number(di)}
                        stops={days[di]}
                        refreshStops={async () => {
                          const s = await fetchStopsForTrip(trip.id);
                          setStopsByTrip((prev) => ({
                            ...prev,
                            [trip.id]: s || [],
                          }));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
