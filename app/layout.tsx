import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script'
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
        <head>
          {/* Meta Pixel Code */}
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod ?
                n.callMethod.apply(n,arguments) : n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '3220546341440227');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript
            dangerouslySetInnerHTML={{
              __html:
                "<img height='1' width='1' style='display:none' src='https://www.facebook.com/tr?id=3220546341440227&ev=PageView&noscript=1' />",
            }}
          />
          {/* End Meta Pixel Code */}
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f7f8fc] text-[#1c2238]`}>
          <SiteHeader />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}