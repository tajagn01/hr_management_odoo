"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarOff,
  DollarSign,
  User,
  Settings,
  Moon,
  Sun,
  Laptop,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isManager = pathname?.startsWith("/manager");
  const userRole = (session?.user as any)?.role || "EMPLOYEE";

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const adminNavItems = [
    { href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
    { href: "/admin/employees", label: "Manage Employees", icon: Users },
    { href: "/admin/attendance", label: "All Attendance", icon: CalendarCheck },
    { href: "/admin/leave-requests", label: "Leave Requests", icon: CalendarOff },
    { href: "/admin/payroll", label: "Payroll Management", icon: DollarSign },
  ];

  const managerNavItems = [
    { href: "/manager", label: "Manager Dashboard", icon: LayoutDashboard },
    { href: "/manager/team", label: "My Team", icon: Users },
    { href: "/manager/attendance", label: "Team Attendance", icon: CalendarCheck },
    { href: "/manager/profile", label: "My Profile", icon: User },
  ];

  const employeeNavItems = [
    { href: "/employee", label: "My Dashboard", icon: LayoutDashboard },
    { href: "/employee/attendance", label: "My Attendance", icon: CalendarCheck },
    { href: "/employee/leave", label: "My Leave", icon: CalendarOff },
    { href: "/employee/payroll", label: "My Payroll", icon: DollarSign },
    { href: "/employee/profile", label: "My Profile", icon: User },
  ];

  // Determine which nav items to show based on role
  const navItems = userRole === "ADMIN"
    ? adminNavItems
    : userRole === "MANAGER"
      ? managerNavItems
      : employeeNavItems;

  const getPlaceholder = () => {
    if (userRole === "ADMIN") return "Search employees, attendance, payroll...";
    if (userRole === "MANAGER") return "Search team, attendance, profile...";
    return "Search attendance, leave, payroll...";
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={getPlaceholder()} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>System</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push("#"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("#"))}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem
            onSelect={() => runCommand(() => {
              const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
              return signOut({ callbackUrl: `${baseUrl}/` });
            })}
            className="text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
