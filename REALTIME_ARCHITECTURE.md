# 🚀 Real-Time HRMS Architecture

## ❌ Why REST + shadcn Alone Isn't Enough

### Current Problems:
1. **Polling Hell**: `setInterval` every 5-10 seconds = 600-1200 requests/minute per user
2. **Stale State**: Data becomes outdated between refresh cycles
3. **Race Conditions**: Multiple users checking in simultaneously cause data conflicts
4. **Battery Drain**: Constant polling on mobile devices
5. **Server Load**: 10,000 users × 12 requests/min = 120,000 requests/minute
6. **No Instant Feedback**: Users see delays, poor UX

### REST Limitations:
- **Request-Response Only**: Server can't push updates to clients
- **Stateless**: No persistent connection
- **No Event-Driven Updates**: Must manually refresh
- **Scalability Issues**: Polling doesn't scale

---

## ✅ Real-Time Architecture Solution

### **Socket.IO + Event-Driven Pattern**

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │◄───────►│ Socket.IO    │◄───────►│   Database  │
│  (shadcn)   │  WebSocket│   Server     │  Prisma │  PostgreSQL │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │                        │
      ▼                        ▼
┌─────────────┐         ┌──────────────┐
│  React      │         │  Event       │
│  Context    │         │  Emitter     │
└─────────────┘         └──────────────┘
```

### **Event Flow:**
1. Employee checks in → API creates record → Emits `attendance:checkin`
2. Socket.IO broadcasts to:
   - **Admin rooms**: `admin:dashboard`, `admin:attendance`
   - **Employee room**: `employee:{employeeId}`
3. Clients receive event → Update shadcn state → UI re-renders instantly

---

## 🏗️ Architecture Components

### 1. **Socket.IO Server** (`lib/socket-server.ts`)
- Handles WebSocket connections
- Room management (admin/employee separation)
- Authentication via NextAuth session
- Event broadcasting

### 2. **Real-Time Context** (`contexts/realtime-context.tsx`)
- React Context for Socket.IO connection
- State management for real-time data
- Automatic reconnection logic
- Event listeners for shadcn components

### 3. **Event Emitter Service** (`lib/realtime-emitter.ts`)
- Centralized event emission
- Type-safe event payloads
- Broadcast to specific rooms
- Prevents duplicate events

### 4. **Updated APIs**
- Attendance API emits events after DB write
- Leave API emits events on status change
- Payroll API emits events on updates

### 5. **shadcn Component Updates**
- Cards: Listen to `stats:update`
- Tables: Listen to `attendance:update`
- Charts: Listen to `data:refresh`
- Badges: Listen to `status:change`

---

## 📊 Event Types

### **Attendance Events:**
- `attendance:checkin` - Employee checks in
- `attendance:checkout` - Employee checks out
- `attendance:update` - Attendance record updated
- `stats:dashboard` - Dashboard stats changed

### **Leave Events:**
- `leave:created` - New leave request
- `leave:approved` - Leave approved
- `leave:rejected` - Leave rejected
- `leave:updated` - Leave status changed

### **Notification Events:**
- `notification:admin` - Admin-specific notification
- `notification:employee` - Employee-specific notification

---

## 🔒 Security & Scalability

### **Authentication:**
- Socket.IO middleware validates NextAuth session
- Room access based on user role
- Employee can only join their own room

### **Scalability (10,000+ users):**
- Redis adapter for multi-server support
- Room-based broadcasting (only relevant clients)
- Event debouncing for high-frequency updates
- Connection pooling

### **Performance:**
- Single WebSocket connection per client
- Binary protocol for large payloads
- Compression enabled
- Heartbeat for connection health

---

## 🎯 Single Source of Truth

**Database** → **Socket.IO Server** → **All Connected Clients**

- No client-side state conflicts
- Server is authoritative
- All clients receive same update
- Eventual consistency guaranteed

