import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

export default function ProfileTabs({
  tabs = [],
  children,
  defaultActiveKey,
  activeKey,
  onChange,
  stick = true,
}) {
  const firstKey = useMemo(() => tabs[0]?.key, [tabs]);
  const [internalKey, setInternalKey] = useState(defaultActiveKey || firstKey);

  const isControlled = activeKey !== undefined && onChange;
  const currentKey = isControlled ? activeKey : internalKey;

  useEffect(() => {
    if (tabs.length && !tabs.find((t) => t.key === currentKey)) {
      if (isControlled) onChange?.(firstKey);
      else setInternalKey(firstKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.map((t) => t.key).join("|")]);

  function setActive(key) {
    if (isControlled) onChange?.(key);
    else setInternalKey(key);
  }

  const panels = Array.isArray(children) ? children : [children].filter(Boolean);
  const activePanel =
    panels.find((c) => c?.props?.tabKey === currentKey) ?? null;

  return (
    <div>
      {/* Header */}
      <div
        className={`${stick ? "sticky top-0 z-10" : ""} bg-white/80 backdrop-blur border-b`}
        role="tablist"
        aria-label="Profile sections"
      >
        <nav className="flex justify-around sm:justify-start gap-2 sm:gap-4 px-3 sm:px-6 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const selected = t.key === currentKey;

            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${t.key}`}
                id={`tab-${t.key}`}
                onClick={() => setActive(t.key)}
                onKeyDown={(e) => {
                  if (["Enter", " "].includes(e.key)) {
                    e.preventDefault();
                    setActive(t.key);
                  }
                }}
                className={`relative py-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base outline-none transition-all px-2 sm:px-3 rounded-lg ${
                  selected
                    ? "text-amber-600 font-semibold"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span className="ml-0.5 text-xs text-gray-400">
                    ({t.count})
                  </span>
                )}

                {selected && (
                  <motion.div
                    layoutId="activeTabLine"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Panel */}
      <div
        className="p-4 sm:p-6"
        role="tabpanel"
        id={`panel-${currentKey}`}
        aria-labelledby={`tab-${currentKey}`}
      >
        {activePanel}
      </div>
    </div>
  );
}

/** Panel wrapper */
ProfileTabs.Panel = function Panel({ children }) {
  return children;
};
