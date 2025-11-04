import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Replik - Create Your Digital Clone',
  description: 'Build and interact with your personalized AI clone. Train your voice, upload your context, and create a digital version of yourself.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-dark-bg text-white min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

