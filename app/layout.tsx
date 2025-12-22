import { type Metadata } from 'next'
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
          <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
            <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#212529' }}>BTTH 2.0</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <SignedOut>
                  <SignInButton mode='modal'>
                    <Button className="cursor-pointer text-sm sm:text-base px-3 py-2 sm:px-4 min-h-[40px]" style={{ backgroundColor: '#4F46E5' }}>
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