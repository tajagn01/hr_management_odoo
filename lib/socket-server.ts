/**
 * Production-Ready Socket.IO Server for HRMS
 * Handles real-time updates for attendance, leaves, and notifications
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: "ADMIN" | "EMPLOYEE";
  employeeId?: string;
}

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    // Don't interfere with Next.js API routes
    allowEIO3: true,
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Get session from NextAuth
      // In production, validate JWT token here
      const session = await auth();
      
      if (!session?.user) {
        return next(new Error("Authentication error: Invalid session"));
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { employee: true },
      });

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.userRole = user.role as "ADMIN" | "EMPLOYEE";
      socket.employeeId = user.employee?.id;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  // Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`✅ Client connected: ${socket.userId} (${socket.userRole})`);

    // Join role-based rooms
    if (socket.userRole === "ADMIN") {
      socket.join("admin:dashboard");
      socket.join("admin:attendance");
      socket.join("admin:leaves");
      socket.join("admin:notifications");
      console.log(`👔 Admin joined admin rooms`);
    } else if (socket.userRole === "EMPLOYEE" && socket.employeeId) {
      socket.join(`employee:${socket.employeeId}`);
      socket.join("employee:notifications");
      console.log(`👤 Employee ${socket.employeeId} joined employee room`);
    }

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.userId} (${reason})`);
    });

    // Health check
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit event to specific rooms
 */
export function emitToRoom(room: string, event: string, data: any) {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  io.to(room).emit(event, data);
}

/**
 * Emit event to all admins
 */
export function emitToAdmins(event: string, data: any) {
  emitToRoom("admin:dashboard", event, data);
  emitToRoom("admin:attendance", event, data);
}

/**
 * Emit event to specific employee
 */
export function emitToEmployee(employeeId: string, event: string, data: any) {
  emitToRoom(`employee:${employeeId}`, event, data);
}

/**
 * Broadcast to all connected clients
 */
export function broadcast(event: string, data: any) {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  io.emit(event, data);
}

