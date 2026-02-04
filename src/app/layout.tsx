import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { Providers } from "./providers";

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
  description: "Holocron Academy — a Generative UI learning experience powered by Tambo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <Providers apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY}>{children}</Providers>
      </body>
    </html>
  );
}
