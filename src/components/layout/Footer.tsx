import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-gradient-to-b from-background to-muted/30">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm">
                F
              </div>
              <span className="text-lg font-bold gradient-text">FindIt</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A community-driven platform for reporting and recovering lost items. Powered by intelligent matching.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link href="/browse" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Browse Items
              </Link>
              <Link href="/report/new?type=lost" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Report Lost Item
              </Link>
              <Link href="/report/new?type=found" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Report Found Item
              </Link>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Account</h3>
            <div className="flex flex-col gap-2">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Log In
              </Link>
              <Link href="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sign Up
              </Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Info</h3>
            <div className="flex flex-col gap-2">
              <Link href="/info/how-matching-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                How Matching Works
              </Link>
              <Link href="/info/dti-capstone-project" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                DTI Capstone Project
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FindIt. Lost & Found Platform.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
