import React from "react";
import { motion } from "framer-motion";

export default function Loading({ text = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      {/* Spinner */}
      <motion.div
        className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      {/* Text */}
      <motion.div
        className="mt-4 text-sm text-neutral-600 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {text}
      </motion.div>
    </div>
  );
}
