import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { AppProviders } from "@/app/providers";
import { TAMBO_PUBLIC_API_KEY } from "@/config/env";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Holocron Academy",
  description: "Holocron Academy — generative UI learning modules powered by Tambo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} galactic-terminal min-h-screen antialiased`}
      >
        <AppProviders tamboApiKey={TAMBO_PUBLIC_API_KEY}>{children}</AppProviders>
      </body>
    </html>
  );
}
