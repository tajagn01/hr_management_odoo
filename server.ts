/**
 * Custom Next.js Server with Socket.IO Support
 * Required for real-time WebSocket connections
 * 
 * IMPORTANT: For development, use "npm run dev" (standard Next.js server)
 * For production with real-time, compile this first: tsc server.ts && node server.js
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initializeSocketIO } from "./lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      
      // Let Socket.IO handle its own routes
      if (parsedUrl.pathname?.startsWith("/api/socket.io")) {
        // Socket.IO will handle this
        return;
      }
      
      // Handle all other routes (including API routes) with Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("internal server error");
      }
    }
  });

  // Initialize Socket.IO (must be after httpServer creation)
  initializeSocketIO(httpServer);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO initialized on /api/socket.io`);
    });
}).catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

