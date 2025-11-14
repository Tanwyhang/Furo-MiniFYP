import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./client-providers";

const walletConnectProjectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!walletConnectProjectId) {
  throw new Error(
    "NEXT_PUBLIC_PROJECT_ID is required for WalletConnect. Create a project at https://cloud.walletconnect.com and set NEXT_PUBLIC_PROJECT_ID in .env.local."
  );
}

// TypeScript knows this is now a string because of the validation above
const projectId: string = walletConnectProjectId;


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Furo - API Marketplace",
  description: "Monetize your APIs with crypto micropayments using x402 protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-mono antialiased`}
      >
        <ClientProviders projectId={projectId}>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
