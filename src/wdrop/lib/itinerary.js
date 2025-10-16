/**
 * wdrop/lib/itinerary.js
 * Helpers to build itinerary structures from trip stops.
 * Pure functions only — no Supabase imports here.
 */

/**
 * Group stops by day_index and return sorted days.
 *
 * @param {Array} stops - List of stops (each stop should have day_index).
 * @returns {Array<{day_index:number,stops:Array}>}
 */
export function groupStopsByDay(stops = []) {
  if (!Array.isArray(stops)) return [];

  const grouped = new Map();

  for (const stop of stops) {
    const day = stop.day_index ?? 0;
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day).push(stop);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day_index, stops]) => ({
      day_index,
      stops: stops.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    }));
}

/**
 * Generate a display label for a day (Day 1, Day 2, etc).
 * @param {number} index
 * @returns {string}
 */
export function dayLabel(index) {
  return `Day ${index + 1}`;
}

/**
 * Calculate trip duration in days based on stops or explicit dates.
 *
 * @param {Object} trip
 * @param {Array} stops
 * @returns {number}
 */
export function tripDuration(trip, stops = []) {
  if (trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }

  // fallback: max day_index from stops
  const maxDay = Math.max(0, ...stops.map((s) => s.day_index ?? 0));
  return maxDay + 1;
}

/**
 * Flatten grouped itinerary into a linear list of stops with day labels.
 * @param {Array} stops
 * @returns {Array<{day_label:string,stop:Object}>}
 */
export function flattenItinerary(stops = []) {
  const days = groupStopsByDay(stops);
  const flat = [];
  for (const day of days) {
    for (const stop of day.stops) {
      flat.push({
        day_label: dayLabel(day.day_index),
        stop,
      });
    }
  }
  return flat;
}
