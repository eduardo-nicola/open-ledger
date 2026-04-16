import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";

import { Providers } from "@/lib/providers";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Open Ledger",
  description: "Suas finanças em um só lugar",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} antialiased`}>
        <Suspense fallback={children}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
