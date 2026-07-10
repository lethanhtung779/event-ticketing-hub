import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HtmlLang } from "./HtmlLang";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TicketHub - Online Event Ticketing",
  description: "Vietnam's leading online event ticketing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-black">
        <Providers>
          <HtmlLang />
          <Header />
          <main className="flex-1"><ErrorBoundary>{children}</ErrorBoundary></main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
