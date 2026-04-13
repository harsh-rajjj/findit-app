"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
        setLoading(false);
      } else {
        setRedirecting(true);
        router.replace("/dashboard");
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center animate-fade-in-up">
          <div className="w-12 h-12 rounded-full gradient-primary mx-auto flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-lg font-medium gradient-text">Taking you to your dashboard...</p>
          <p className="text-sm text-muted-foreground mt-1">Just a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/50 animate-scale-in">
        {/* Left — Branding Panel */}
        <div className="hidden md:flex flex-col justify-center items-center gradient-hero text-white p-10 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/5 rounded-full animate-float" />

          <div className="relative z-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold mx-auto mb-6">
              F
            </div>
            <h2 className="text-3xl font-bold mb-3">Welcome Back</h2>
            <p className="text-white/70 max-w-xs leading-relaxed">
              Log in to track your reports, view matches, and recover your lost items.
            </p>
          </div>
        </div>

        {/* Right — Form */}
        <div className="bg-card p-8 sm:p-10 flex flex-col justify-center">
          {/* Mobile branding */}
          <div className="md:hidden text-center mb-6">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              F
            </div>
            <h1 className="text-2xl font-bold">Welcome Back</h1>
          </div>

          <h2 className="text-xl font-bold hidden md:block mb-1">Log In</h2>
          <p className="text-muted-foreground text-sm mb-6 hidden md:block">
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-center gap-2 animate-slide-down">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter your username"
                required
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                className="mt-1.5 h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 gradient-primary text-white border-0 shadow-md shadow-primary/20 hover:opacity-90 transition-all font-medium"
              disabled={loading}
              id="login-submit"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
