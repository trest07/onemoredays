import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AlertContext = createContext({
  showAlert: () => {},
  showConfirm: () => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState({ message: "", type: "info" });

  const showAlert = (opts) => {
    setOptions({ ...opts, type: opts.type || "info" });
    setVisible(true);
  };

  const showConfirm = (opts) => {
    setOptions({ ...opts, type: "confirm" });
    setVisible(true);
  };

  const handleClose = () => setVisible(false);
  const handleConfirm = () => {
    if (options.onConfirm) options.onConfirm();
    setVisible(false);
  };

  const getAccent = (type) => {
    switch (type) {
      case "error":
        return "border-red-400 bg-red-50 text-red-700";
      case "success":
        return "border-emerald-400 bg-emerald-50 text-emerald-700";
      case "warning":
        return "border-amber-400 bg-amber-50 text-amber-700";
      default:
        return "border-blue-400 bg-blue-50 text-blue-700";
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`w-[90%] max-w-sm rounded-2xl shadow-lg border p-6 ${getAccent(
                options.type
              )}`}
            >
              {/* Header */}
              <h3 className="text-base font-semibold mb-2 capitalize">
                {options.title || 
                  (options.type === "confirm" ? "Please Confirm" : "Dialog")}
              </h3>

              {/* Message */}
              <p className="text-sm mb-6 leading-relaxed">{options.message}</p>

              {/* Buttons */}
              {options.type === "confirm" ? (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 text-sm rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                  >
                    OK
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};
