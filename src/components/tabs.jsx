import { createContext, useContext, useState } from "react";

const TabsContext = createContext();

export function Tabs({ children, defaultValue }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }) {
  return <div className={className}>{children}</div>;
}

export function TabsTrigger({ children, value }) {
  const { active, setActive } = useContext(TabsContext);
  const isActive = active === value;
  return (
    <button
      onClick={() => setActive(value)}
      className={`px-3 py-1 ${isActive ? "bg-neutral-300" : ""}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value }) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div>{children}</div>;
}
