import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
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
    "theme-color": "#0D0D0F",
    "color-scheme": "dark",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0D0D0F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
