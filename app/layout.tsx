import { type Metadata } from 'next'
import Image from 'next/image'
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Button } from "@/components/ui/button"

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
          <header className="sticky top-0 z-50 w-full border-b border-[#dfe3fb] bg-white/90 backdrop-blur">
            <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/bt-logo.png"
                  alt="Bakliwal Tutorials logo"
                  width={44}
                  height={44}
                  className="h-10 w-10 rounded-lg object-contain ring-1 ring-[#dfe3fb]"
                  priority
                />
                <div className="leading-tight">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#969cc0]">BTTH 2.0</p>
                  <p className="text-base sm:text-lg font-semibold text-[#333b62]">Bakliwal Tutorials</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <SignedOut>
                  <SignInButton mode='modal'>
                    <Button className="cursor-pointer text-sm sm:text-base px-3 py-2 sm:px-5 min-h-[40px] bg-[#333b62] hover:bg-[#272d4e] border border-transparent text-white shadow-sm">
                      Admin Login
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}