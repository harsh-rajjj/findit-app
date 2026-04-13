"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setPasswordStrength(score);
  };

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Fair";
    if (passwordStrength <= 4) return "Strong";
    return "Very Strong";
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        setRedirecting(true);
        router.replace("/dashboard");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      if (!redirecting) setLoading(false);
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
          <p className="text-lg font-medium gradient-text">Setting up your dashboard...</p>
          <p className="text-sm text-muted-foreground mt-1">Your account has been created!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/50 animate-scale-in">
        {/* Left — Branding Panel */}
        <div className="hidden md:flex flex-col justify-center items-center gradient-hero text-white p-10 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/5 rounded-full animate-float" />

          <div className="relative z-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold mx-auto mb-6">
              F
            </div>
            <h2 className="text-3xl font-bold mb-3">Join FindIt</h2>
            <p className="text-white/70 max-w-xs leading-relaxed">
              Create an account to report items, find matches, and connect with your community.
            </p>
            <div className="mt-8 space-y-3 text-left">
              {[
                "Report lost or found items instantly",
                "Smart matching algorithm",
                "Secure claim & verification system",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4 text-emerald-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="bg-card p-8 sm:p-10 flex flex-col justify-center">
          {/* Mobile branding */}
          <div className="md:hidden text-center mb-6">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              F
            </div>
            <h1 className="text-2xl font-bold">Join FindIt</h1>
          </div>

          <h2 className="text-xl font-bold hidden md:block mb-1">Create Account</h2>
          <p className="text-muted-foreground text-sm mb-6 hidden md:block">
            Sign up to start reporting lost and found items
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
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
                placeholder="Choose a username"
                required
                minLength={3}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Choose a password"
                required
                minLength={6}
                className="mt-1.5 h-11"
                onChange={(e) => checkPasswordStrength(e.target.value)}
              />
              {/* Password strength indicator */}
              {passwordStrength > 0 && (
                <div className="mt-2 animate-slide-up">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          i < passwordStrength ? getStrengthColor() : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{getStrengthLabel()}</p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                className="mt-1.5 h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 gradient-primary text-white border-0 shadow-md shadow-primary/20 hover:opacity-90 transition-all font-medium"
              disabled={loading}
              id="register-submit"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
