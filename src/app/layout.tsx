import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/components/NextAuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Campus EV Services",
  description: "Electric Scooty rental for MIT-ADT Campus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <NextAuthProvider>
            {children}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
