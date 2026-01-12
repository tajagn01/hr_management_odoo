import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { RealtimeProvider } from "@/contexts/realtime-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DayFlow HRMS",
  description: "Modern HR Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
            <RealtimeProvider>
              {children}
            </RealtimeProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
