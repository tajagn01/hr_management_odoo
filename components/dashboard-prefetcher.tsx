"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { queryKeys } from "@/lib/hooks/query-keys";

export const DashboardPrefetcher = () => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { data: session } = useSession();
    const role = session?.user?.role;
    const employeeId = session?.user?.employeeId;

    useEffect(() => {
        // ── 1. Prefetch Routes by Role ─────────────────────
        const adminRoutes = ["/admin", "/admin/employees", "/admin/attendance", "/admin/leave-requests", "/admin/payroll"];
        const managerRoutes = ["/manager", "/manager/team", "/manager/attendance", "/manager/profile"];
        const employeeRoutes = ["/employee", "/employee/attendance", "/employee/leave", "/employee/payroll", "/employee/profile"];

        const routes = role === "ADMIN" ? adminRoutes : role === "MANAGER" ? managerRoutes : employeeRoutes;
        routes.forEach((route) => router.prefetch(route));

        // ── 2. Prefetch Data by Role ───────────────────────
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const now = new Date();
        const istTime = new Date(now.getTime() + IST_OFFSET_MS - (now.getTimezoneOffset() * 60 * 1000));
        const today = new Date(Date.UTC(istTime.getUTCFullYear(), istTime.getUTCMonth(), istTime.getUTCDate()));
        const tomorrow = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));

        const prefetchData = async () => {
            try {
                const allPrefetches: Promise<void>[] = [];

                // ── Shared: Employee List ──
                allPrefetches.push(
                    queryClient.prefetchQuery({
                        queryKey: queryKeys.employees.list(),
                        queryFn: async () => (await fetch("/api/employees")).json(),
                        staleTime: Infinity,
                    })
                );

                // ── Admin-specific ──
                if (role === "ADMIN") {
                    allPrefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.employees.withPayroll(),
                            queryFn: async () => (await fetch("/api/employees?includePayroll=true")).json(),
                            staleTime: Infinity,
                        }),
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.attendance.dashboard(today.toISOString()),
                            queryFn: async () => (await fetch(`/api/attendance?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`)).json(),
                            staleTime: Infinity,
                        }),
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.leave.list(),
                            queryFn: async () => (await fetch("/api/leave")).json(),
                            staleTime: Infinity,
                        }),
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.leave.pending(),
                            queryFn: async () => {
                                const data = await (await fetch("/api/leave?status=PENDING")).json();
                                return data.leaveRequests?.length ?? 0;
                            },
                            staleTime: 30_000,
                        })
                    );
                }

                // ── Manager-specific ──
                if (role === "MANAGER") {
                    allPrefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.attendance.dashboard(today.toISOString()),
                            queryFn: async () => (await fetch(`/api/attendance?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`)).json(),
                            staleTime: Infinity,
                        }),
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.leave.list(),
                            queryFn: async () => (await fetch("/api/leave")).json(),
                            staleTime: Infinity,
                        })
                    );
                }

                // ── Employee-specific ──
                if ((role === "EMPLOYEE" || role === "MANAGER") && employeeId) {
                    allPrefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.employees.overview(employeeId),
                            queryFn: async () => (await fetch(`/api/employees/${employeeId}/overview`)).json(),
                            staleTime: 60_000,
                        }),
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.employees.byEmail(session?.user?.email ?? ""),
                            queryFn: async () => (await fetch(`/api/employees?email=${encodeURIComponent(session?.user?.email ?? "")}`)).json(),
                            staleTime: 5 * 60_000,
                        })
                    );
                }

                await Promise.all(allPrefetches);
                console.log(`🚀 [${role}] Dashboard data & routes prefetched — 0ms navigation activated`);
            } catch (err) {
                console.error("Prefetch failed:", err);
            }
        };

        if (role) prefetchData();
    }, [queryClient, router, role, employeeId, session?.user?.email]);

    return null;
};
