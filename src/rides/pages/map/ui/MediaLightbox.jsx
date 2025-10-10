// src/features/posts/ui/MediaLightbox.jsx
import { useEffect, useCallback } from "react";

export default function MediaLightbox({ type, src, alt, onClose }) {
  // Close on ESC key
  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center"
      onClick={onClose} // close when clicking backdrop
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()} // prevent backdrop close when clicking media
      >
        {type === "video" ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[85vh] rounded-lg"
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          />
        )}

        {/* Close button */}
        <button
          type="button"
          className="absolute top-3 right-3 text-white text-3xl leading-none"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
