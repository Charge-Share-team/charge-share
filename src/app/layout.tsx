import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VehicleProvider } from '@/context/VehicleContext';
// Import the missing AuthProvider
import { AuthProvider } from '@/components/AuthProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChargeShare - EV Social Network",
  description: "Share your charger, grow the community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Wrap everything in AuthProvider first, then VehicleProvider */}
        <AuthProvider>
          <VehicleProvider>
            {children}
          </VehicleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}