import React from "react";
import { Link } from "react-router-dom";

export default function TripCard({ trip, onEdit, onDelete }) {
  return (
    <div className="flex border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="w-32 h-32 flex-shrink-0 bg-neutral-100 relative">
        {trip.image_url ? (
          <img
            src={trip.image_url}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-neutral-400">
            No image
          </div>
        )}
      </div>

      {/* Text and buttons */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold truncate">{trip.title}</h3>
          {trip.start_date && (
            <p className="text-xs text-neutral-500">
              {trip.start_date} → {trip.end_date || "…"}
            </p>
          )}
          <p className="text-sm text-neutral-700 line-clamp-3 mt-1">{trip.description}</p>
        </div>

        {/* Buttons */}
        <div className="mt-2 flex gap-2 justify-end">
          <Link
            to={`/trips/${trip.id}`}
            className="text-xs bg-amber-600 px-2 py-1 rounded text-white hover:bg-amber-700"
          >
            View
          </Link>
          <button
            onClick={() => onEdit?.(trip)}
            className="text-xs bg-green-600 px-2 py-1 rounded text-white hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={onDelete ? () => onDelete(trip.id) : null}
            className="text-xs bg-red-600 px-2 py-1 rounded text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
