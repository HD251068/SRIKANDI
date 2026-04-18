// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SRIKANDI — Sistem Riset Intelijen Kriminal Andalan Indonesia',
  description: 'Platform intelijen interogasi berbasis AI untuk kepolisian Indonesia',
  robots: 'noindex, nofollow',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
