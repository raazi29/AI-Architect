import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/AuthContext"
import { ProfileProvider } from "@/contexts/ProfileContext"
import Web3ErrorBoundary from "@/components/error-boundary/Web3ErrorBoundary"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/toast-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "AR Interior Design - AI-Powered Room Redesign",
  description:
    "Transform your space with AI-powered interior design, AR furniture placement, and smart shopping integration (temporarily unavailable)",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Archi AR",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Performance: preconnect and dns-prefetch for image CDNs */}
        <link rel="preconnect" href="https://images.pexels.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//images.pexels.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="preconnect" href="https://cdn.pixabay.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//cdn.pixabay.com" />
        <link rel="preconnect" href="https://picsum.photos" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//picsum.photos" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider>
          <Web3ErrorBoundary>
            <AuthProvider>
              <ProfileProvider>
                <Suspense fallback={null}>{children}</Suspense>
              </ProfileProvider>
            </AuthProvider>
          </Web3ErrorBoundary>
        </ThemeProvider>
        <ToastProvider />
        <Analytics />
      </body>
    </html>
  )
}
