import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Toaster } from "@/components/ui/sonner";
import { getOrCreateSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrCreateSettings();
  return {
    title: settings.name,
    description: `Seva receipt counter for ${settings.name}`,
    appleWebApp: {
      title: settings.name,
      statusBarStyle: "default",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#b54708",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getOrCreateSettings();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Nav templeName={settings.name} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-6 print:max-w-none print:p-0">
            {children}
          </main>
          <div className="print:hidden">
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
