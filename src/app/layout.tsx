export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/providers/next-theme-provider";
import { twMerge } from "tailwind-merge";
import { DM_Sans } from "next/font/google";
import AppStateProvider from "@/lib/providers/state-provider";
import { SupabaseUserProvider } from "@/lib/providers/supabase-user-provider";
import { Toaster } from "@/components/ui/toaster";
import { SocketProvider } from "@/lib/providers/socket-provider";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={twMerge("bg-background", dmSans.className)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AppStateProvider>
            <SupabaseUserProvider>
              <SocketProvider>
                {children}
                <Toaster />
              </SocketProvider>
            </SupabaseUserProvider>
          </AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
