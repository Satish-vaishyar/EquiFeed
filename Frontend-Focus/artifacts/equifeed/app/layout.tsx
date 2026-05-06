import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "../src/index.css";

export const metadata: Metadata = {
  title: "EquiFeed",
  description: "Equestrian social feed for creators and viewers.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EquiFeed",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/onboarding"
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/onboarding"
    >
      <html lang="en" suppressHydrationWarning>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
