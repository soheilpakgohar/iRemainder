import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// IRANSansX — self-hosted via next/font/local. Generates a @font-face with
// the font files inlined/hashed, preloads them, and applies the family as a
// CSS variable (--font-sans) consumed in globals.css. Zero layout shift,
// no runtime external requests. Weights 400 (Regular) + 700 (Bold).
const iranSansX = localFont({
  src: [
    {
      path: "./fonts/IRANSansX-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap", // show fallback text immediately, swap when loaded
});

export const metadata: Metadata = {
  title: "اقسات‌یار | Installment Reminder",
  description: "یادآور سررسید اقساط فروشگاهی",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // prevent zoom on input focus (iOS) for app-like feel
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // RTL + Persian lang drives text direction, digit shaping, and calendar layout.
    // The font variable class sets --font-sans, consumed by body in globals.css.
    <html
      lang="fa"
      dir="rtl"
      className={`${iranSansX.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
