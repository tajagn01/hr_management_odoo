/**
 * Real-Time Context Provider for shadcn/ui Components
 * Manages Socket.IO connection and real-time state updates
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

interface RealtimeContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionFailed: boolean;
  // Attendance state
  attendanceStats: {
    presentToday: number;
    totalEmployees: number;
    pendingLeaves: number;
    monthlyPayroll: number;
  };
  // Real-time update handlers
  updateAttendanceStats: (stats: Partial<RealtimeContextType["attendanceStats"]>) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    presentToday: 0,
    totalEmployees: 0,
    pendingLeaves: 0,
    monthlyPayroll: 0,
  });

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 2; // Reduced from 5 to fail faster when server not available

  // Update attendance stats
  const updateAttendanceStats = useCallback((stats: Partial<typeof attendanceStats>) => {
    setAttendanceStats((prev) => ({ ...prev, ...stats }));
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    // Skip Socket.IO in development mode unless explicitly configured
    // Socket.IO requires the custom server (server.ts) which isn't used in 'npm run dev'
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) {
      // No socket URL configured - skip initialization
      setConnectionFailed(true);
      return;
    }

    const newSocket = io(socketUrl, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      auth: {
        email: session.user.email, // Pass user email for authentication
        token: session.user.email, // Also pass as token for compatibility
      },
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Socket.IO connected");
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected:", reason);
      setIsConnected(false);

      // Auto-reconnect logic
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setTimeout(() => {
          newSocket.connect();
        }, 1000 * reconnectAttempts.current);
      }
    });

    newSocket.on("connect_error", (error) => {
      // Only log on first attempt to avoid spamming console
      if (reconnectAttempts.current === 0) {
        console.log("Socket.IO: Real-time server not available (this is normal in dev mode)");
      }
      setIsConnected(false);
      reconnectAttempts.current++;

      // Stop trying after max attempts
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setConnectionFailed(true);
        newSocket.disconnect();
      }
    });

    // Real-time event listeners
    newSocket.on("attendance:checkin", (data: any) => {
      console.log("📥 Received attendance:checkin", data);
      setAttendanceStats((prev) => ({
        ...prev,
        presentToday: prev.presentToday + 1,
      }));
    });

    newSocket.on("attendance:checkout", (data: any) => {
      console.log("📥 Received attendance:checkout", data);
      // Handle check-out if needed
    });

    newSocket.on("stats:dashboard", (data: any) => {
      console.log("📥 Received stats:dashboard", data);
      setAttendanceStats({
        presentToday: data.presentToday || 0,
        totalEmployees: data.totalEmployees || 0,
        pendingLeaves: data.pendingLeaves || 0,
        monthlyPayroll: data.monthlyPayroll || 0,
      });
    });

    newSocket.on("stats:update", (data: any) => {
      console.log("📥 Received stats:update", data);
      if (data.type === "attendance" && data.presentToday) {
        setAttendanceStats((prev) => ({
          ...prev,
          presentToday: Math.max(0, prev.presentToday + (data.presentToday === "+1" ? 1 : -1)),
        }));
      }
      if (data.type === "leaves" && data.pendingLeaves) {
        setAttendanceStats((prev) => ({
          ...prev,
          pendingLeaves: Math.max(0, prev.pendingLeaves + (data.pendingLeaves === "+1" ? 1 : -1)),
        }));
      }
    });

    newSocket.on("chart:refresh", (data: any) => {
      console.log("📥 Received chart:refresh", data);
      // Trigger chart refresh (components will listen to this)
      window.dispatchEvent(new CustomEvent("chart:refresh", { detail: data }));
    });

    newSocket.on("notification:admin", (data: any) => {
      console.log("📥 Received admin notification", data);
      // Dispatch with ADMIN role so only admin pages show it
      window.dispatchEvent(new CustomEvent("notification:admin", {
        detail: { ...data, role: "ADMIN" }
      }));
    });

    newSocket.on("notification:employee", (data: any) => {
      console.log("📥 Received employee notification", data);
      // Dispatch with EMPLOYEE role so only employee pages show it
      window.dispatchEvent(new CustomEvent("notification:employee", {
        detail: { ...data, role: "EMPLOYEE" }
      }));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
      setIsConnected(false);
    };
  }, [session, status]);

  const value: RealtimeContextType = {
    socket,
    isConnected,
    connectionFailed,
    attendanceStats,
    updateAttendanceStats,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook to use real-time context
 */
export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}

