import { useEffect, useMemo, useState } from "react";

/**
 * ProfileTabs
 * - Uncontrolled by default; pass `defaultActiveKey` to set initial tab.
 * - Controlled mode if you pass `activeKey` + `onChange`.
 * - Usage:
 *   <ProfileTabs tabs={[{key:'drops',label:'Drops'}, ...]}>
 *     <ProfileTabs.Panel tabKey="drops">...</ProfileTabs.Panel>
 *     <ProfileTabs.Panel tabKey="trips">...</ProfileTabs.Panel>
 *   </ProfileTabs>
 */
export default function ProfileTabs({
  tabs = [],
  children,
  defaultActiveKey,
  activeKey,
  onChange,
  stick = true, // sticky header by default
}) {
  const firstKey = useMemo(() => tabs[0]?.key, [tabs]);
  const [internalKey, setInternalKey] = useState(defaultActiveKey || firstKey);

  const isControlled = activeKey !== undefined && onChange;
  const currentKey = isControlled ? activeKey : internalKey;

  useEffect(() => {
    // if tabs change and current key disappears, reset to first
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

  // Normalize children into array and find the active panel
  const panels = Array.isArray(children) ? children : [children].filter(Boolean);
  const activePanel =
    panels.find((c) => c?.props?.tabKey === currentKey) ?? null;

  return (
    <div>
      <div
        className={`${stick ? "sticky top-0 z-10" : ""} bg-white border-b`}
        role="tablist"
        aria-label="Profile sections"
      >
        <nav className="flex gap-4 px-4 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const selected = t.key === currentKey;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${t.key}`}
                id={`tab-${t.key}`}
                className={`py-3 text-sm whitespace-nowrap outline-none ${
                  selected
                    ? "font-semibold border-b-2 border-black"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                onClick={() => setActive(t.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(t.key);
                  }
                }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        className="p-4"
        role="tabpanel"
        id={`panel-${currentKey}`}
        aria-labelledby={`tab-${currentKey}`}
      >
        {activePanel}
      </div>
    </div>
  );
}

/**
 * Panel wrapper: <ProfileTabs.Panel tabKey="drops">...</ProfileTabs.Panel>
 */
ProfileTabs.Panel = function Panel({ children }) {
  return children;
};
