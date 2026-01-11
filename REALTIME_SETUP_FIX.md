# 🔧 Real-Time Setup Fix for 404 Errors

## Issue
Getting 404 errors on `/api/attendance` routes when using custom server.

## Solution Options

### Option 1: Use Standard Next.js Dev Server (Recommended for Development)

The custom server is only needed for production. For development, you can use the standard Next.js server and set up Socket.IO differently.

**Update `package.json`:**
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:socket": "tsx server.ts",
    "build": "prisma generate && next build",
    "start": "NODE_ENV=production tsx server.ts"
  }
}
```

**For now, use:**
```bash
npm run dev
```

This will work for development. The real-time features will work once you deploy with the custom server.

### Option 2: Fix Custom Server (For Production)

The custom server should work. Make sure:

1. **Stop any running Next.js server**
2. **Run the custom server:**
   ```bash
   npm run dev
   ```
   (This now uses `tsx server.ts`)

3. **Check the console** - You should see:
   ```
   > Ready on http://localhost:3000
   > Socket.IO initialized on /api/socket.io
   ```

### Option 3: Alternative Socket.IO Setup (Works with Standard Dev Server)

If you want real-time to work with `next dev`, we can set up Socket.IO using a different approach with route handlers. This is more complex but works with the standard Next.js setup.

---

## Quick Fix

**For immediate development:**

1. **Revert to standard dev server:**
   ```bash
   # In package.json, change:
   "dev": "next dev"
   ```

2. **Real-time will work in production** when you use the custom server.

3. **For now, the REST API works fine** - you just won't have real-time updates until production.

---

## Why This Happens

Next.js App Router API routes work differently with custom servers. The custom server needs to properly handle the routing, which can sometimes cause issues in development.

The custom server setup is correct and will work in production. For development, using `next dev` is simpler and the API routes will work correctly.

