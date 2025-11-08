import { useEffect, useState } from "react";
import { getUserNotifications, markNotificationsRead } from "../lib/notifications";
import Loading from "../../components/Loading";
import { useNotifications } from "../context/NotificationsContext";
import { useAuth } from "../../context/AuthContext";

export default function NotificationsPage() {
  const { loggedUser } = useAuth();
  const { refreshUnread } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loggedUser) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getUserNotifications(loggedUser.id);
        setNotifications(data);
        await markNotificationsRead(loggedUser.id);
        refreshUnread();
      } catch (e) {
        console.error("Error fetching notifications:", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loggedUser]);

  if (loading) return <Loading text="Loading notifications…" />;

  if (!notifications.length)
    return <div className="p-6 text-center text-gray-500">No new notifications</div>;

  return (
    <div className="p-4 space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="p-3 rounded-lg border hover:bg-gray-50 transition"
        >
          <div className="text-sm text-gray-800">{n.message}</div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(n.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
