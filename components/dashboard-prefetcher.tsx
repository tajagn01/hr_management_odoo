"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const DashboardPrefetcher = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    useEffect(() => {
        // 1. Prefetch ALL Routes (JS Bundles)
        const routes = [
            "/admin",
            "/admin/employees",
            "/admin/attendance",
            "/admin/leave-requests",
            "/admin/payroll",
        ];

        routes.forEach((route) => {
            router.prefetch(route);
        });

        // 2. Prefetch ALL Data
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Run prefetches in background immediately on mount
        const prefetchData = async () => {
            try {
                await Promise.all([
                    // Employees List + Payroll
                    queryClient.prefetchQuery({
                        queryKey: ['employees', 'with-payroll'],
                        queryFn: async () => {
                            const res = await fetch("/api/employees?includePayroll=true");
                            return res.json();
                        },
                        staleTime: Infinity,
                    }),
                    queryClient.prefetchQuery({
                        queryKey: ['employees', 'full-list'],
                        queryFn: async () => {
                            // This might be redundant with the one above depending on API usage, 
                            // but prefetching strictly what Employees page needs ensures 0ms there too.
                            // Assuming it hits the same underlying API/Cache usually.
                            const res = await fetch("/api/employees");
                            return res.json();
                        },
                        staleTime: Infinity,
                    }),

                    // Attendance
                    queryClient.prefetchQuery({
                        queryKey: ['attendance', 'dashboard', today.toISOString()],
                        queryFn: async () => {
                            const res = await fetch(`/api/attendance?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`);
                            return res.json();
                        },
                        staleTime: Infinity,
                    }),

                    // Leave Requests
                    queryClient.prefetchQuery({
                        queryKey: ['leave-requests', 'all'],
                        queryFn: async () => {
                            const res = await fetch("/api/leave");
                            return res.json();
                        },
                        staleTime: Infinity,
                    }),
                ]);
                console.log("🚀 Dashboard data & routes prefetched successfully (0ms mode activated)");
            } catch (err) {
                console.error("Prefetch failed:", err);
            }
        };

        prefetchData();
    }, [queryClient, router]);

    return null; // This component renders nothing
};
