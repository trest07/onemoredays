// src/pages/MapPage.jsx
/**
 * MapPage
 * -----------
 * PURPOSE:
 * - This is an optional, secondary page that sits alongside the main home map.
 * - Your *primary* interactive map already lives on the home route ("/").
 * - Use this page if you want a dedicated route for map-related actions
 *   (e.g., deep linking, SEO, or a place to show lists/filters next to a map).
 *
 * WHAT IT SHOWS:
 * - Header with quick links to "Add Pin" and "My Pins".
 * - A small preview list of current pins (non-interactive).
 *
 * HOW TO ADD THE MAP HERE (OPTIONAL):
 * - If you ever want the same interactive map on this page, import your map
 *   component (e.g., MainMap) and mount it in the indicated spot below.
 *   Make sure the parent layout (App.jsx) reserves bottom padding for your
 *   fixed bottom bar so taps aren’t intercepted.
 *
 * LAYOUT NOTES:
 * - This page uses a standard centered container with padding and card blocks.
 * - It relies on the surrounding layout (App.jsx) to handle safe-areas and
 *   bottom padding for the fixed bottom nav.
 */

import React from "react";
import { Link } from "react-router-dom";
import { getPins } from "@/rides/pages/pinStore"


export default function MapPage() {
  // Read-only preview of pins; the interactive map is on "/"
  const pins = getPins();

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Header: title + quick actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Map & Pins</h1>
        <div className="flex gap-2">
          <Link
            to="/pins/new"
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
            aria-label="Add a new pin"
          >
            Add Pin
          </Link>
          <Link
            to="/pins/mine"
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
            aria-label="View my pins"
          >
            My Pins
          </Link>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {/* Page purpose / guidance */}
        <div className="rounded-lg border bg-white/70 p-3">
          <p className="text-sm text-gray-600">
            Your main map already lives on the home screen. This page is optional.
            If you want the same map here, just mount your map component below.
          </p>
        </div>

        {/* OPTIONAL: mount your interactive map here
            Example:
            <div className="rounded-lg overflow-hidden border">
              <MainMap />
            </div>
            Be sure your layout reserves space for the fixed bottom bar.
        */}

        {/* Pins preview list (read-only) */}
        <div className="rounded-lg border bg-white p-3">
          <h2 className="text-sm font-medium mb-2">Active Pins (preview)</h2>
          {pins.length === 0 ? (
            <p className="text-sm text-gray-500">No active pins yet.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {pins.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-red-500"
                    aria-hidden
                  />
                  <span className="font-medium">{p.note || "(no note)"}</span>
                  <span className="text-gray-500">
                    — {p.lat.toFixed(5)}, {p.lng.toFixed(5)} · {p.ttlHours}h
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
