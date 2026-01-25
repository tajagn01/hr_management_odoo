"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data is considered fresh FOREVER. Manual invalidation required for updates.
                        staleTime: Infinity,
                        // Keep unused data in cache FOREVER.
                        gcTime: Infinity,
                        // Never retry failed requests (fail fast)
                        retry: 0,
                        // Disable all automatic refetch triggers
                        refetchOnWindowFocus: false,
                        refetchOnMount: false,
                        refetchOnReconnect: false,
                        // IMPORTANT: This allows us to use `placeholderData` effectively
                        refetchInterval: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
