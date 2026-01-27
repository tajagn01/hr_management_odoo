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
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent } from "@/components/sidebar";
import { useNotifications } from "@/contexts/notification-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


// Dynamically import CommandMenu to prevent hydration mismatch
const CommandMenu = dynamic(() => import("@/components/command-menu").then(mod => ({ default: mod.CommandMenu })), {
  ssr: false,
});

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const isAdmin = pathname?.startsWith("/admin");
  const userRole = (session?.user as any)?.role || "EMPLOYEE";

  // Use real notifications from context
  const { notifications, unreadCount, markAllAsRead, markAsRead, clearAllNotifications } = useNotifications();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mark all notifications as read when dropdown opens
  const handleNotificationOpen = useCallback(async (open: boolean) => {
    setIsNotificationOpen(open);
    if (open && unreadCount > 0) {
      await markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // Use current origin to ensure correct redirect in production
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      await signOut({ callbackUrl: `${baseUrl}/`, redirect: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect to current origin
      if (typeof window !== 'undefined') {
        window.location.href = window.location.origin + "/";
      }
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
            {/* Mobile Menu */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SidebarContent onItemClick={() => setIsSheetOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Logo - Hidden on mobile */}
            <Link href={isAdmin ? "/admin" : "/employee"} className="hidden md:flex items-center gap-3">
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
                {userRole === "ADMIN"
                  ? "Search employees, attendance, payroll..."
                  : userRole === "MANAGER"
                    ? "Search team, attendance..."
                    : "Search attendance, leave, payroll..."}
              </div>
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </button>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button - Hidden per request */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-9 w-9 rounded-xl lg:hidden"
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
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const getIcon = () => {
                          switch (notification.type) {
                            case "SUCCESS":
                              return <CheckCircle2 className="h-4 w-4 text-green-500" />;
                            case "ERROR":
                              return <XCircle className="h-4 w-4 text-red-500" />;
                            case "WARNING":
                              return <CalendarOff className="h-4 w-4 text-amber-500" />;
                            case "INFO":
                            default:
                              return <AlertCircle className="h-4 w-4 text-blue-500" />;
                          }
                        };

                        const getBgColor = () => {
                          switch (notification.type) {
                            case "SUCCESS":
                              return "bg-green-100 dark:bg-green-900/30";
                            case "ERROR":
                              return "bg-red-100 dark:bg-red-900/30";
                            case "WARNING":
                              return "bg-amber-100 dark:bg-amber-900/30";
                            case "INFO":
                            default:
                              return "bg-blue-100 dark:bg-blue-900/30";
                          }
                        };

                        // Format time from createdAt timestamp
                        const getTimeAgo = (timestamp: string) => {
                          const now = new Date();
                          const created = new Date(timestamp);
                          const diffMs = now.getTime() - created.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMs / 3600000);
                          const diffDays = Math.floor(diffMs / 86400000);

                          if (diffMins < 1) return "Just now";
                          if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                          if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                          return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                        };

                        return (
                          <div
                            key={notification.id}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                            }}
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
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <Clock className="inline h-3 w-3 mr-1" />
                                {getTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
                {notifications.length > 0 && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => setShowClearDialog(true)}
                    >
                      Clear All
                    </Button>
                  </div>
                )}
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

      {/* Clear All Notifications Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all notifications? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                await clearAllNotifications();
                setShowClearDialog(false);
              }}
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
