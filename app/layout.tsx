import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { panchang } from "@/lib/fonts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_TITLE =
  "Modfem Autos | Direct Canadian Auto Dealership & Nigeria Landed Import Portal";
const SITE_DESCRIPTION =
  "Source luxury and executive vehicles directly from Canada to Lagos. Transparent landed cost calculations, age-tiered customs duties, and live Atlantic shipment tracking.";
const OG_IMAGE_URL =
  "https://images.unsplash.com/photo-1773866796453-27ced06f8984?auto=format&fit=crop&w=1200&h=630&q=80";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Modfem Autos — Canada to Lagos vehicle import",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_URL],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${panchang.variable} h-full antialiased`}
    >
      <body className="h-full bg-zinc-950">{children}</body>
    </html>
  );
}
