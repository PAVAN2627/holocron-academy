import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { AppProviders } from "@/app/providers";

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
  const tamboApiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? null;

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} galactic-terminal min-h-screen antialiased`}
      >
        <AppProviders tamboApiKey={tamboApiKey}>{children}</AppProviders>
      </body>
    </html>
  );
}
