"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Search,
  Settings,
  LogOut,
  User,
  HelpCircle,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  CalendarOff,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";

// Dynamically import CommandMenu to prevent hydration mismatch
const CommandMenu = dynamic(() => import("@/components/command-menu").then(mod => ({ default: mod.CommandMenu })), {
  ssr: false,
});

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  role?: "ADMIN" | "EMPLOYEE" | "ALL";
}

// Initial mock notifications
const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "leave_approved",
    title: "Leave Request Approved",
    message: "Your vacation leave for Jan 15-17 has been approved",
    time: "2 hours ago",
    read: false,
    role: "EMPLOYEE",
  },
  {
    id: 2,
    type: "leave_pending",
    title: "New Leave Request",
    message: "John Doe requested sick leave for Jan 10",
    time: "3 hours ago",
    read: false,
    role: "ADMIN",
  },
  {
    id: 3,
    type: "leave_rejected",
    title: "Leave Request Rejected",
    message: "Your personal leave for Jan 20 was rejected",
    time: "1 day ago",
    read: true,
    role: "EMPLOYEE",
  },
  {
    id: 4,
    type: "payroll",
    title: "Payroll Processed",
    message: "December 2025 salary has been credited",
    time: "2 days ago",
    read: true,
    role: "ALL",
  },
  {
    id: 5,
    type: "reminder",
    title: "Attendance Reminder",
    message: "Don't forget to check out before leaving",
    time: "3 days ago",
    read: true,
    role: "ALL",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const isAdmin = pathname?.startsWith("/admin");
  const userRole = (session?.user as any)?.role || "EMPLOYEE";

  // Filter notifications based on user role
  const filteredNotifications = notifications.filter(n =>
    n.role === "ALL" || n.role === userRole
  );

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mark all notifications as read when dropdown opens
  const handleNotificationOpen = useCallback((open: boolean) => {
    setIsNotificationOpen(open);
    if (open && unreadCount > 0) {
      // Mark all notifications as read
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    }
  }, [unreadCount]);

  // Listen for new notifications from real-time events
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const data = event.detail;
      const newNotification: Notification = {
        id: Date.now(),
        type: data.type || "info",
        title: data.title || "Notification",
        message: data.message || "",
        time: "Just now",
        read: false,
        role: data.role || "ALL",
      };

      // Only add if matches user role
      if (newNotification.role === "ALL" || newNotification.role === userRole) {
        setNotifications(prev => [newNotification, ...prev]);
      }
    };

    window.addEventListener("notification:show", handleNewNotification as EventListener);
    window.addEventListener("notification:admin", handleNewNotification as EventListener);
    window.addEventListener("notification:employee", handleNewNotification as EventListener);

    return () => {
      window.removeEventListener("notification:show", handleNewNotification as EventListener);
      window.removeEventListener("notification:admin", handleNewNotification as EventListener);
      window.removeEventListener("notification:employee", handleNewNotification as EventListener);
    };
  }, [userRole]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if signOut fails
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  return (
    <>
      <CommandMenu />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Left Section - Logo & Branding */}
          <div className="flex items-center gap-4">
            <Link href={isAdmin ? "/admin" : "/employee"} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  DayFlow
                </h1>
                <p className="text-[10px] text-muted-foreground -mt-1">HR Management</p>
              </div>
            </Link>
          </div>

          {/* Center Section - Search (Click to open command menu) */}
          <button
            onClick={() => setCommandOpen(true)}
            className="hidden lg:flex flex-1 max-w-md mx-8"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <div className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-muted/50 text-sm flex items-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
                Search anything...
              </div>
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </button>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl lg:hidden"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <DropdownMenu open={isNotificationOpen} onOpenChange={handleNotificationOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-xl p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount === 0 ? "All read" : `${unreadCount} new`}
                  </Badge>
                </div>
                <ScrollArea className="h-80">
                  <div className="p-2">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      filteredNotifications.map((notification) => {
                        const getIcon = () => {
                          switch (notification.type) {
                            case "leave_approved":
                            case "success":
                              return <CheckCircle2 className="h-4 w-4 text-green-500" />;
                            case "leave_rejected":
                            case "error":
                              return <XCircle className="h-4 w-4 text-red-500" />;
                            case "leave_pending":
                            case "warning":
                              return <CalendarOff className="h-4 w-4 text-amber-500" />;
                            case "payroll":
                              return <DollarSign className="h-4 w-4 text-blue-500" />;
                            case "reminder":
                            case "info":
                              return <AlertCircle className="h-4 w-4 text-purple-500" />;
                            default:
                              return <Bell className="h-4 w-4 text-muted-foreground" />;
                          }
                        };

                        const getBgColor = () => {
                          switch (notification.type) {
                            case "leave_approved":
                            case "success":
                              return "bg-green-100 dark:bg-green-900/30";
                            case "leave_rejected":
                            case "error":
                              return "bg-red-100 dark:bg-red-900/30";
                            case "leave_pending":
                            case "warning":
                              return "bg-amber-100 dark:bg-amber-900/30";
                            case "payroll":
                              return "bg-blue-100 dark:bg-blue-900/30";
                            case "reminder":
                            case "info":
                              return "bg-purple-100 dark:bg-purple-900/30";
                            default:
                              return "bg-muted";
                          }
                        };

                        return (
                          <div
                            key={notification.id}
                            className={cn(
                              "flex gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                              !notification.read && "bg-muted/30"
                            )}
                          >
                            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", getBgColor())}>
                              {getIcon()}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className={cn("text-sm font-medium leading-none", !notification.read && "font-semibold")}>
                                  {notification.title}
                                </p>
                                {notification.role && notification.role !== "ALL" && (
                                  <Badge variant="outline" className="text-[10px] px-1">
                                    {notification.role === "ADMIN" ? "Admin" : "You"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <Clock className="inline h-3 w-3 mr-1" />
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
                <div className="border-t p-2">
                  <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground">
                    View all notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle - Simple Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700 dark:text-slate-400" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Separator */}
            <div className="h-8 w-px bg-border mx-2 hidden sm:block" />

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-10 px-2 rounded-xl"
                >
                  <Avatar className="h-8 w-8 border-2 border-blue-100">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-500 text-white text-xs font-medium">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{userName}</span>
                    <span className="text-[10px] text-muted-foreground">{userEmail}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "w-fit mt-1 text-[10px]",
                        userRole === "ADMIN"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      )}
                    >
                      {userRole}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={isAdmin ? "/admin/profile" : "/employee/profile"}>
                  <DropdownMenuItem className="rounded-lg cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="rounded-lg cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 disabled:opacity-50"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
