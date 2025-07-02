import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link"; // Link bileşenini ekle

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Görsel İşleyici SaaS",
  description: "AI Destekli Alt Metin ve WebP Dönüştürücü",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="p-4 bg-gray-800 text-white flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Image Optimizer
          </Link>
          <div>
            <Link href="/upload" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200">
              Upload Image
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}