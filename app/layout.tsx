import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { APP_METADATA } from "@/constants/app-config";
import { FloatingNav } from "@/components/floating-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://txsim.com"),
  title: APP_METADATA.title,
  description: APP_METADATA.description,
  openGraph: {
    title: APP_METADATA.title,
    description: APP_METADATA.description,
    siteName: APP_METADATA.title,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_METADATA.title,
    description: APP_METADATA.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="relative mx-auto min-h-screen max-w-5xl pt-28">
          <main>{children}</main>
        </div>
        <FloatingNav />
      </body>
    </html>
  );
}
