import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Macondo City',
  description: '3D city of Macondo projects',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 p-0 overflow-hidden bg-[#7ec8e3]">{children}</body>
    </html>
  )
}
