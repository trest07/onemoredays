// src/components/IosInstallPrompt.jsx
import { useEffect, useState } from "react";

/**
 * Centered iOS "Add to Home Screen" prompt.
 * - Shows only on iPhone/iPad Safari when not already installed (navigator.standalone !== true)
 * - Remembers "Close" for 7 days via localStorage to avoid nagging
 */
export default function IosInstallPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const ua = (navigator.userAgent || "").toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isStandalone = navigator.standalone === true; // iOS Safari only
      const isSafari =
        // iOS Safari has "safari" but not "crios" (Chrome) or "fxios" (Firefox)
        isIOS && ua.includes("safari") && !ua.includes("crios") && !ua.includes("fxios");

      // respect prior dismissal (7 days)
      const LAST_HIDE_KEY = "ios_install_prompt:last_hide";
      const lastHide = Number(localStorage.getItem(LAST_HIDE_KEY) || 0);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (isIOS && isSafari && !isStandalone && Date.now() - lastHide > sevenDays) {
        // tiny delay so it appears after initial layout
        const t = setTimeout(() => setOpen(true), 400);
        return () => clearTimeout(t);
      }
    } catch {
      /* no-op */
    }
  }, []);

  if (!open) return null;

  function close(save = true) {
    try {
      if (save) localStorage.setItem("ios_install_prompt:last_hide", String(Date.now()));
    } catch {}
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white border shadow-xl p-5">
        <button
          type="button"
          aria-label="Close"
          className="absolute top-2 right-2 text-neutral-500 hover:text-black"
          onClick={() => close(true)}
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-2">Add to Home Screen</h2>
        <p className="text-sm text-neutral-700 mb-3">
          Install this app to your iPhone for a faster, full-screen experience.
        </p>

        <ol className="list-decimal list-inside text-sm text-neutral-800 space-y-2">
          <li>
            Tap the <b>Share</b> icon in Safari (square with an arrow ↑).
          </li>
          <li>
            Scroll and tap <b>Add to Home Screen</b>.
          </li>
          <li>
            Tap <b>Add</b>.
          </li>
        </ol>

        <p className="text-xs text-neutral-500 mt-3">
          Tip: This only appears in Safari on iPhone/iPad and won’t show once installed.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="px-3 h-9 rounded-lg border border-neutral-300 text-sm"
            onClick={() => close(true)}
          >
            Close
          </button>
          <button
            type="button"
            className="px-3 h-9 rounded-lg bg-black text-white text-sm"
            onClick={() => close(false)}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
