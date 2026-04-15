"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    await signOut({ redirect: false, callbackUrl: "/" });
    // Always stay on the current origin (prevents jumping to stale NEXTAUTH_URL).
    window.location.assign("/");
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-strong shadow-lg shadow-primary/5"
          : "bg-background/80 backdrop-blur-sm"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" id="nav-logo">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-110">
              F
            </div>
            <span className="text-xl font-bold gradient-text">FindIt</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/browse"
              className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent font-medium text-sm transition-all duration-200"
              id="nav-browse"
            >
              Browse Items
            </Link>

            {status === "authenticated" ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent font-medium text-sm transition-all duration-200"
                  id="nav-dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  href="/matches"
                  className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent font-medium text-sm transition-all duration-200"
                  id="nav-matches"
                >
                  Matches
                </Link>

                <div className="flex items-center gap-2 ml-2">
                  <Link href="/report/new?type=lost">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-3 rounded-lg border-0 shadow-none transition-all hover:opacity-95"
                      id="nav-report-lost"
                    >
                      I Lost Something
                    </Button>
                  </Link>
                  <Link href="/report/new?type=found">
                    <Button
                      size="sm"
                      className="h-8 px-3 rounded-lg gradient-primary text-white border-0 shadow-none transition-all hover:opacity-90"
                      id="nav-report-found"
                    >
                      I Found Something
                    </Button>
                  </Link>
                </div>

                {/* Notification Bell */}
                <div className="ml-1">
                  <NotificationBell />
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Profile dropdown */}
                <div className="relative ml-2" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                    id="nav-profile-toggle"
                  >
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                      {session.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="font-medium text-sm hidden lg:block">{session.user?.name}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 glass-strong rounded-xl shadow-xl shadow-primary/10 py-1 animate-scale-in ring-1 ring-border" id="nav-profile-menu">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent rounded-lg mx-1 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        My Reports
                      </Link>
                      <div className="border-t border-border mx-2 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg mx-1 transition-colors"
                        id="nav-signout"
                        style={{ width: "calc(100% - 8px)" }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <ThemeToggle />
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-medium" id="nav-login">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="gradient-primary text-white border-0 shadow-sm shadow-primary/20 hover:opacity-90" id="nav-signup">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors touch-target"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            id="nav-mobile-toggle"
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
        <div
          ref={menuRef}
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1 pt-2 border-t border-border">
            <div className="flex items-center justify-between px-2 pb-1">
              <ThemeToggle />
              {status === "authenticated" && <NotificationBell />}
            </div>
            <Link
              href="/browse"
              className="flex items-center gap-3 px-3 py-3 hover:bg-accent rounded-lg transition-colors touch-target"
              onClick={() => setIsMenuOpen(false)}
              id="nav-mobile-browse"
            >
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Items
            </Link>
            {status === "authenticated" ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-3 hover:bg-accent rounded-lg transition-colors touch-target"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/matches"
                  className="flex items-center gap-3 px-3 py-3 hover:bg-accent rounded-lg transition-colors touch-target"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Matches
                </Link>
                <div className="grid grid-cols-2 gap-2 px-2 mt-2">
                  <Link href="/report/new?type=lost" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="destructive" size="sm" className="w-full h-10 rounded-lg shadow-none">I Lost Something</Button>
                  </Link>
                  <Link href="/report/new?type=found" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full h-10 rounded-lg gradient-primary text-white border-0 shadow-none">I Found Something</Button>
                  </Link>
                </div>
                <div className="border-t border-border mt-2 pt-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-3 text-left text-destructive hover:bg-destructive/10 rounded-lg transition-colors touch-target"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out ({session.user?.name})
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-2 mt-2">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Log In</Button>
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button size="sm" className="w-full gradient-primary text-white border-0">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
