"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            FindIt
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/browse" className="text-muted-foreground hover:text-foreground font-medium">
              Browse Items
            </Link>

            {status === "authenticated" ? (
              <>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground font-medium">
                  Dashboard
                </Link>
                <Link href="/matches" className="text-muted-foreground hover:text-foreground font-medium">
                  Matches
                </Link>
                <div className="flex items-center gap-3">
                  <Link href="/report/new?type=lost">
                    <Button variant="destructive" size="sm">I Lost Something</Button>
                  </Link>
                  <Link href="/report/new?type=found">
                    <Button variant="secondary" size="sm">I Found Something</Button>
                  </Link>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-muted rounded-md"
                  >
                    <span className="font-medium">{session.user?.name}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-background border rounded-md shadow-lg py-1">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Reports
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-3">
              <Link href="/browse" className="px-2 py-2 hover:bg-muted rounded-md" onClick={() => setIsMenuOpen(false)}>
                Browse Items
              </Link>
              {status === "authenticated" ? (
                <>
                  <Link href="/dashboard" className="px-2 py-2 hover:bg-muted rounded-md" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/matches" className="px-2 py-2 hover:bg-muted rounded-md" onClick={() => setIsMenuOpen(false)}>
                    Matches
                  </Link>
                  <Link href="/report/new?type=lost" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="destructive" size="sm" className="w-full">I Lost Something</Button>
                  </Link>
                  <Link href="/report/new?type=found" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">I Found Something</Button>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="px-2 py-2 text-left hover:bg-muted rounded-md"
                  >
                    Sign Out ({session.user?.name})
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-2 py-2 hover:bg-muted rounded-md" onClick={() => setIsMenuOpen(false)}>
                    Log In
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
