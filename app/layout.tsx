import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'nikel admin',
  description: 'Created with oioioi',
  generator: 'oioioi.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
