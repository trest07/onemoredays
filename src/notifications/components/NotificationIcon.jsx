import { Bell } from "lucide-react";
// import { useNotifications } from "@/context/NotificationsContext.jsx";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationsContext";

export default function NotificationIcon() {
  const { unreadCount } = useNotifications();

  return (
    <Link to="/notifications" className="relative inline-flex items-center justify-center">
      <Bell size={24} className="text-gray-700 hover:text-black transition" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
      )}
    </Link>
  );
}
