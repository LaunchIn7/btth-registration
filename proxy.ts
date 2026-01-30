import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl

  // ✅ Public webhook route (no Clerk auth)
  if (pathname === '/api/payment/webhook') {
    return NextResponse.next()
  }

  // 👇 Optional: enforce auth for everything else
  // const { userId } = auth()
  // if (!userId) {
  //   return NextResponse.redirect(new URL('/sign-in', req.url))
  // }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
