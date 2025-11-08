import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUnreadCount } from "../lib/notifications";

const NotificationsContext = createContext({
  unreadCount: 0,
  refreshUnread: () => {},
});

export function NotificationsProvider({ children }) {
  const { loggedUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  async function refreshUnread() {
    if (!loggedUser) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await getUnreadCount(loggedUser.id);
      setUnreadCount(count);
    } catch (e) {
      console.error("Failed to fetch unread count:", e.message);
    }
  }

  useEffect(() => {
    refreshUnread();
  }, [loggedUser]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnread }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
