import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/site-header'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BTTH 2.0 - Bakliwal Tutorials Talent Hunt',
  description: 'Register for BTTH 2.0 - Merit-based Talent Hunt & Scholarship Exam for Future JEE Toppers',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/bt-logo.png',
  },
  openGraph: {
    title: 'BTTH 2.0 - Bakliwal Tutorials Talent Hunt',
    description: 'Register for BTTH 2.0 - Merit-based Talent Hunt & Scholarship Exam for Future JEE Toppers',
    images: ['/bt-logo.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f7f8fc] text-[#1c2238]`}>
          <SiteHeader />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}