import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EchoSelf - Your AI Clone',
  description: 'Create your interactive voice and visual AI clone',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-dark-bg text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}

