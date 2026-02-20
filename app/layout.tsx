import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Sparky - Electrician Field Management',
  description: 'Professional electrician field management platform with NEC calculators, job tracking, and code reference.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-512x512.jpg',
    apple: '/icon-512x512.jpg',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f1115',
  width: 'device-width',
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
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid #333',
              color: '#f0f0f0',
              borderRadius: '0',
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
