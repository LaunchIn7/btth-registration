"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const navLinks = [
  { label: 'Overview', href: '#overview' },
  { label: 'About BTTH', href: '#about' },
  { label: 'Why BTTH 2.0', href: '#why-btth' },
  { label: 'Eligibility', href: '#eligibility' },
  { label: 'Exam Details', href: '#exam-details' },
  { label: 'Testimonials', href: '#testimonials' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#dfe3fb] bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/bt-logo.png"
            alt="Bakliwal Tutorials logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-contain ring-1 ring-[#dfe3fb]"
            priority
          />
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#969cc0]">BTTH 2.0</p>
            <p className="text-base font-semibold text-[#333b62]">Bakliwal Tutorials</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#4b5575]">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-[#333b62]">
              {link.label}
            </Link>
          ))}
          <Link href="#register">
            <Button size="sm" className="bg-[#333b62] hover:bg-[#272d4e] text-white">
              Register Now
            </Button>
          </Link>
        </nav>

        <Drawer direction="left">
          <DrawerTrigger asChild>
            <button
              aria-label="Open navigation"
              className="flex size-10 items-center justify-center rounded-md border border-[#e0e6ff] text-[#333b62] shadow-sm transition hover:bg-[#f4f6ff] lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="w-[80%] max-w-sm rounded-none border-r border-[#dfe3fb] bg-white">
            <DrawerHeader className="flex flex-row items-center justify-between border-b border-[#ecefff] px-4 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#969cc0]">BTTH 2.0</p>
                <p className="text-base font-semibold text-[#333b62]">Bakliwal Tutorials</p>
              </div>
              <DrawerTitle className="sr-only">Site navigation</DrawerTitle>
              <DrawerClose asChild>
                <button
                  aria-label="Close navigation"
                  className="rounded-md border border-[#e0e6ff] px-2 py-1 text-sm text-[#4b5575] hover:bg-[#f4f6ff]"
                >
                  Close
                </button>
              </DrawerClose>
            </DrawerHeader>
            <div className="flex flex-col gap-2 px-4 py-4">
              {navLinks.map((link) => (
                <DrawerClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-md px-2 py-2 text-base font-medium text-[#1d243c] hover:bg-[#f5f6fb]"
                  >
                    {link.label}
                  </Link>
                </DrawerClose>
              ))}
            </div>
            <div className="border-t border-[#ecefff] px-4 py-4">
              <DrawerClose asChild>
                <Link href="#register" className="block w-full">
                  <Button className="w-full bg-[#333b62] hover:bg-[#272d4e] text-white">
                    Register Now
                  </Button>
                </Link>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  )
}
