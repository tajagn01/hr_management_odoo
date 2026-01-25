/**
 * Socket.IO API Route Handler for Next.js App Router
 * This file is required for Socket.IO to work with Next.js
 */

import { NextRequest } from "next/server";

// This route is handled by the Socket.IO server
// The actual Socket.IO server is initialized in server.ts or custom server
export async function GET(request: NextRequest) {
  return new Response("Socket.IO endpoint", { status: 200 });
}

export async function POST(request: NextRequest) {
  return new Response("Socket.IO endpoint", { status: 200 });
}

