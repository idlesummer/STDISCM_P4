import './globals.css'
import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Training Dashboard',
  description: 'View real-time training',
}

export default function RootLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontSize: '1.125rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontWeight: '500',
            },
          }}
        />
      </body>
    </html>
  )
}
