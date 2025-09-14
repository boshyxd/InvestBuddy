"use client";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Inter, DM_Mono } from "next/font/google";
import "./globals.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HomeIcon, TargetIcon, UserIcon, UsersIcon, MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

// Inter is used by many modern financial institutions for its clean, professional appearance
// Similar to what Wealthsimple, Stripe, and other fintech companies use
const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// DM Mono for numerical displays and code
const dmMono = DM_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isDemo = pathname?.startsWith("/demo");

  const navItems = [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/goals", icon: TargetIcon, label: "Goals" },
    { href: "/friends", icon: UsersIcon, label: "Friends" },
    { href: "/u/you", icon: UserIcon, label: "Profile" },
  ];

  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmMono.variable} antialiased bg-background text-foreground`}>
        <div className="min-h-screen">
          {/* Top navbar with integrated menu */}
          {!isDemo && (
            <motion.header initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="sticky top-0 z-50 card-shine bg-gradient-to-r from-primary via-blue-600 to-primary text-primary-foreground shadow-lg backdrop-blur-xl border-b border-white/10">
              <div className="mx-auto w-full max-w-md flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Mobile menu drawer */}
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-white/10 text-white"
                      aria-label="Open navigation"
                    >
                      <MenuIcon className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[240px] p-0 border-0 bg-white dark:bg-gray-900">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
                      {/* Minimal header */}
                      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                          <Image src="/logo.svg" alt="InvestBuddy" width={20} height={20} className="dark:brightness-0 dark:invert" />
                          <span className="font-medium text-gray-900 dark:text-white text-sm">InvestBuddy</span>
                        </div>
                      </div>
                      
                      {/* Simple navigation */}
                      <nav className="flex-1 py-2">
                        {navItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className="flex items-center gap-2.5 px-5 py-2.5 text-foreground/90 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground transition-colors text-sm"
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </nav>

                      {/* Minimal bottom section */}
                      <div className="border-t border-gray-200 dark:border-gray-800 py-3">
                        <Link
                          href="/settings"
                          onClick={() => setSidebarOpen(false)}
                          className="block px-5 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs transition-colors">
                          Settings
                        </Link>
                        <button className="block w-full text-left px-5 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs transition-colors">
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex items-center gap-2">
<Image src="/logo.svg" alt="InvestBuddy logo" width={24} height={24} />
                  <span className="text-base font-bold">InvestBuddy</span>
                </div>
              </div>

              <Link href="/u/you" className="inline-flex items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 p-1 transition-colors">
                <Avatar className="h-8 w-8 ring-2 ring-white/30 shadow-lg">
                  <AvatarImage src="" alt="Angus Bailey's profile" />
                  <AvatarFallback className="bg-white text-primary font-bold text-sm">AB</AvatarFallback>
                </Avatar>
                <span className="sr-only">Open Angus Bailey's profile</span>
              </Link>
              </div>
            </motion.header>
          )}

          {/* Main content with background */}
          {isDemo ? (
            <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="relative">
              {children}
            </motion.div>
          ) : (
            <div className="relative">
              <div className="bg-pattern" aria-hidden="true" />
              <motion.div key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="relative mx-auto w-full max-w-md">
                {children}
              </motion.div>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
