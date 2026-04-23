import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { getBaseUrl } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const headline = Bebas_Neue({
  weight: "400",
  variable: "--font-headline",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "The Tomb Video",
    template: "%s | The Tomb Video",
  },
  alternates: {
    canonical: "/",
  },
  description:
    "Shop a curated collection of new and used film and genre media from retro to contemporary and everything in-between.",
  openGraph: {
    title: "The Tomb Video",
    description:
      "Shop a curated collection of new and used film and genre media from retro to contemporary and everything in-between.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Tomb Video",
    description:
      "Shop a curated collection of new and used film and genre media from retro to contemporary and everything in-between.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${headline.variable} ${mono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <CartProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
