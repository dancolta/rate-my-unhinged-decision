import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rate My Unhinged Decision",
  description:
    "Confess your most questionable life choice. Get judged by AI. Share the damage.",
  metadataBase: new URL("https://ratemyunhinged.app"),
  openGraph: {
    title: "Rate My Unhinged Decision",
    description:
      "How unhinged was that, really? AI-powered judgment for your worst decisions.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rate My Unhinged Decision - AI-powered judgment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rate My Unhinged Decision",
    description: "How unhinged was that, really?",
    images: ["/og-image.png"],
  },
  other: {
    "theme-color": "#0f0f1a",
    "color-scheme": "dark",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f0f1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
