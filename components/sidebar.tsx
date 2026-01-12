"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarOff,
  DollarSign,
  User,
  Menu,
  PanelLeftClose,
  type LucideIcon
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isManager = pathname?.startsWith("/manager");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const adminGroups: NavGroup[] = [
    {
      title: "Overview",
      items: [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Management",
      items: [
        { href: "/admin/employees", label: "Employees", icon: Users },
        { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/admin/leave-requests", label: "Leave Requests", icon: CalendarOff, badge: pendingLeavesCount },
        { href: "/admin/payroll", label: "Payroll", icon: DollarSign },
      ],
    },
  ];

  const managerGroups: NavGroup[] = [
    {
      title: "Overview",
      items: [
        { href: "/manager", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Team Management",
      items: [
        { href: "/manager/team", label: "My Team", icon: Users },
        { href: "/manager/attendance", label: "Team Attendance", icon: CalendarCheck },
      ],
    },
    {
      title: "My Profile",
      items: [
        { href: "/manager/profile", label: "Profile", icon: User },
      ],
    },
  ];

  // ✅ FIX: Only fetch on manual navigation to leave-requests page
  // Remove automatic polling - badges update when user navigates
  useEffect(() => {
    setMounted(true);

    // Only fetch if user is viewing leave-requests page
    if (pathname === "/admin/leave-requests") {
      const fetchPendingLeaves = async () => {
        try {
          const res = await fetch("/api/leave?status=PENDING");
          const data = await res.json();
          if (data.leaveRequests) {
            setPendingLeavesCount(data.leaveRequests.length);
          }
        } catch (error) {
          console.error("Error fetching pending leaves:", error);
        }
      };
      fetchPendingLeaves();
    }
  }, [pathname]);

  const employeeGroups: NavGroup[] = [
    {
      title: "Overview",
      items: [
        { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "My Workspace",
      items: [
        { href: "/employee/attendance", label: "My Attendance", icon: CalendarCheck },
        { href: "/employee/leave", label: "Leave", icon: CalendarOff },
        { href: "/employee/payroll", label: "My Payroll", icon: DollarSign },
        { href: "/employee/profile", label: "Profile", icon: User },
      ],
    },
  ];

  const groups = isAdmin ? adminGroups : isManager ? managerGroups : employeeGroups;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    const content = (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            isActive
              ? "bg-white/20"
              : "bg-muted group-hover:bg-muted/80"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 transition-colors",
              isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
        </div>
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {item.label}
              {item.badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 px-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  {item.badge}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
        mounted && isCollapsed ? "w-18" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-between px-3 py-4 border-b">
        {mounted && !isCollapsed && (
          <span className="text-sm font-semibold text-foreground">Menu</span>
        )}
        {mounted && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5 text-muted-foreground" />
            ) : (
              <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {groups.map((group, index) => (
            <div key={group.title}>
              {mounted && !isCollapsed && (
                <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h4>
              )}
              {isCollapsed && index > 0 && (
                <Separator className="my-4" />
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItemComponent key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3">
        {!isCollapsed && (
          <div className="rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-3">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">DayFlow HRMS</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400">Version 1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  );
}
