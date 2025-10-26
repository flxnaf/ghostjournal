import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'GhostJournal - Your AI Clone',
  description: 'Create your interactive AI clone',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-dark-bg text-white min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

