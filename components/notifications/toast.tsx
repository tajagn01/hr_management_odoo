/**
 * Real-Time Notification Toast Component
 * Displays role-based notifications for Admins and Employees
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  role?: "ADMIN" | "EMPLOYEE" | "ALL"; // Target role for the notification
}

interface NotificationToastProps {
  role?: "ADMIN" | "EMPLOYEE"; // If not provided, will use session role
}

export function NotificationToast({ role: propRole }: NotificationToastProps = {}) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Get user role from session or prop
  const userRole = propRole || (session?.user as any)?.role || "EMPLOYEE";

  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const data = event.detail;
      const notificationRole = data.role || "ALL";

      // Filter notifications based on role
      // Show notification if:
      // 1. It's for ALL users, OR
      // 2. It matches the current user's role
      if (notificationRole !== "ALL" && notificationRole !== userRole) {
        return; // Skip notification not meant for this role
      }

      const notification: Notification = {
        id: Date.now().toString(),
        type: data.type || "info",
        title: data.title || "Notification",
        message: data.message || "",
        timestamp: data.timestamp || new Date().toISOString(),
        role: notificationRole,
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000);
    };

    // Listen for general notifications
    window.addEventListener("notification:show", handleNotification as EventListener);

    // Listen for role-specific notifications
    window.addEventListener("notification:admin", handleNotification as EventListener);
    window.addEventListener("notification:employee", handleNotification as EventListener);

    return () => {
      window.removeEventListener("notification:show", handleNotification as EventListener);
      window.removeEventListener("notification:admin", handleNotification as EventListener);
      window.removeEventListener("notification:employee", handleNotification as EventListener);
    };
  }, [userRole]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={cn(
            "shadow-lg border animate-in slide-in-from-right",
            getBgColor(notification.type)
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{notification.title}</p>
                  {notification.role && notification.role !== "ALL" && (
                    <Badge variant="outline" className="text-xs">
                      {notification.role === "ADMIN" ? "Admin" : "Employee"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

