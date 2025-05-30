import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeScript } from "@/lib/theme-script";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/lib/app-context";
import { QueryProvider } from "@/lib/query-provider";
import { AppHeader } from "@/components/app-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "P2Pool Mini Observer",
  description: "A P2Pool Mini observer application for tracking mining statistics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppProvider>
              <div className="min-h-screen bg-background text-foreground">
                {/* Enhanced Header */}
                <AppHeader />

                {/* Main content */}
                <main className="container mx-auto px-4 py-8">
                  {children}
                </main>

                {/* Footer */}
                <footer className="border-t border-border mt-16">
                  <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
                    <p>&copy; 2024 P2Pool Mini Observer. Built with Next.js, Tailwind CSS 4, and Shadcn/ui.</p>
                  </div>
                </footer>
              </div>
              <Toaster />
            </AppProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
