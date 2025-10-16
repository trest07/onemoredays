import React from "react";

/**
 * ItineraryDay.jsx
 * - Displays one day in a trip itinerary with its list of stops.
 * - Used inside TripDetail or TripList flows.
 */
export default function ItineraryDay({ day, stops = [] }) {
  return (
    <div className="border rounded p-3 mb-4 bg-white shadow-sm">
      <div className="font-semibold mb-2">Day {day + 1}</div>
      {stops.length === 0 ? (
        <div className="text-sm text-gray-500">No stops planned.</div>
      ) : (
        <ul className="list-disc pl-5 space-y-1">
          {stops.map((s) => (
            <li key={s.id} className="text-sm">
              <span className="font-medium">{s.title}</span>
              {s.note && (
                <span className="text-gray-600"> — {s.note}</span>
              )}
              {s.time && (
                <span className="ml-2 text-gray-400 text-xs">
                  ({s.time})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
