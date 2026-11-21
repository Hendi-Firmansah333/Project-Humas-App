import type { Metadata } from "next";
import { Inter, Poppins, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});
const plusJakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TIM HUMAS POLINELA | Admin System",
  description: "Sistem Informasi Kehumasan Berbasis Mobile dan Website Politeknik Negeri Lampung",
  icons: {
    icon: "/logo-humas.png",
    shortcut: "/logo-humas.png",
    apple: "/logo-humas.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className={`${inter.className} ${poppins.variable} ${plusJakarta.variable} font-['Poppins',sans-serif] min-h-full bg-slate-50 text-slate-800 flex flex-col`}>
        <ErrorBoundary>
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

