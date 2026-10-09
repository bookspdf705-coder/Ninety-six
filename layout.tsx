import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/lib/theme-provider";
import { PhotosProvider } from "@/lib/photos-context";
import { Navbar } from "@/components/Navbar";
import { AppGate } from "@/components/AppGate";
import { IntroGate } from "@/components/IntroGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "96",
  description: "Four years, one story — the memories we made along the way.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-text antialiased">
        <ThemeProvider>
          <IntroGate>
            <AppGate>
              <PhotosProvider>
                <Navbar />
                <main className="min-h-screen pt-24">{children}</main>
              </PhotosProvider>
            </AppGate>
          </IntroGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
