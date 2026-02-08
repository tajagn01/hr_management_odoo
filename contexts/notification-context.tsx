/**
 * Simple Notification Context
 * Fetches notifications on load and listens to Socket.IO events
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRealtime } from "./realtime-context";

export interface Notification {
  id: string;
  userId: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { socket, isConnected } = useRealtime();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/notifications?limit=50");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  // Fetch on mount and when session changes
  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status, fetchNotifications]);

  // Listen to Socket.IO events for new notifications (real-time updates)
  useEffect(() => {
    if (!socket || !isConnected) {
      // Socket not connected - notifications will be fetched via API on refresh
      return;
    }

    const handleNewNotification = (notification: any) => {
      console.log("📥 Received new notification via Socket.IO:", notification);

      // Ensure notification has required fields
      const formattedNotification: Notification = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read || false,
        metadata: notification.metadata || null,
        createdAt: notification.createdAt || new Date().toISOString(),
      };

      // Check if notification already exists (prevent duplicates from API fetch)
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === formattedNotification.id);
        if (exists) {
          return prev;
        }
        // Add new notification at the top
        return [formattedNotification, ...prev];
      });

      // Update unread count
      if (!formattedNotification.read) {
        setUnreadCount((prev) => prev + 1);
      }

      // Show toast notification
      window.dispatchEvent(
        new CustomEvent("notification:show", {
          detail: {
            type: formattedNotification.type.toLowerCase(),
            title: formattedNotification.title,
            message: formattedNotification.message,
            timestamp: formattedNotification.createdAt,
          },
        })
      );
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, isConnected]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  // Clear all notifications (delete)
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
