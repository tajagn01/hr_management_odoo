import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import "./animations.css";
import NextAuthProvider from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { NotificationProvider } from "@/contexts/notification-context";
import QueryProvider from "@/components/providers/query-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DayFlow HRMS",
  description: "Modern HR Management System - Employee management, attendance tracking, leave management, and payroll processing",
  openGraph: {
    title: "DayFlow - HR Management System",
    description: "Modern HR Management System with attendance tracking, leave management, and payroll",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DayFlow - HR Management System",
    description: "Modern HR Management System with attendance tracking, leave management, and payroll",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
            <QueryProvider>
              <RealtimeProvider>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </RealtimeProvider>
            </QueryProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
