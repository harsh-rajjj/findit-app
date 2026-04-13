import Link from "next/link";
import { db } from "@/db";
import { reports, categories } from "@/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportCard } from "@/components/reports/ReportCard";

export default async function HomePage() {
  // Get stats
  let totalReports = 0, resolvedReports = 0, activeFoundItems = 0;
  try {
    const [total] = await db.select({ value: count() }).from(reports);
    const [resolved] = await db.select({ value: count() }).from(reports).where(eq(reports.status, "RESOLVED"));
    const [activeFound] = await db.select({ value: count() }).from(reports).where(and(eq(reports.type, "FOUND"), eq(reports.status, "ACTIVE")));
    totalReports = total.value;
    resolvedReports = resolved.value;
    activeFoundItems = activeFound.value;
  } catch { /* DB not ready */ }

  // Get recent found items
  let recentItems: Array<{
    id: string; type: string; title: string; description: string; status: string; createdAt: Date;
    imageUrl: string | null;
    category: { name: string; icon: string | null } | null;
  }> = [];
  try {
    const items = await db
      .select({
        id: reports.id,
        type: reports.type,
        title: reports.title,
        description: reports.description,
        status: reports.status,
        createdAt: reports.createdAt,
        imageUrl: reports.imageUrl,
        categoryName: categories.name,
        categoryIcon: categories.icon,
      })
      .from(reports)
      .leftJoin(categories, eq(reports.categoryId, categories.id))
      .where(and(eq(reports.type, "FOUND"), eq(reports.status, "ACTIVE")))
      .orderBy(desc(reports.createdAt))
      .limit(6);
    
    recentItems = items.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      status: item.status,
      createdAt: item.createdAt,
      imageUrl: item.imageUrl,
      category: item.categoryName ? { name: item.categoryName, icon: item.categoryIcon } : null,
    }));
  } catch { /* DB not ready */ }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative gradient-hero overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white/5 rounded-full animate-float" />
          <div className="absolute bottom-1/3 right-1/3 w-12 h-12 bg-white/5 rounded-full animate-float delay-300" />
          <div className="absolute top-2/3 left-2/3 w-16 h-16 bg-white/5 rounded-full animate-float delay-600" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Community-powered lost & found
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white animate-fade-in-up delay-100">
              Lost Something?
              <br />
              <span className="bg-gradient-to-r from-violet-200 via-white to-violet-200 bg-clip-text text-transparent">
                We&apos;ll Help You Find It.
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/60 max-w-xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              FindIt connects you with people who found your items. Report what
              you lost, and our intelligent matching system will notify you when
              a potential match is found.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
              <Link href="/report/new?type=lost">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-indigo-700 hover:bg-white/90 shadow-xl shadow-black/20 font-semibold h-12 px-8 text-base transition-all hover:scale-105"
                  id="hero-lost-btn"
                >
                  😢 I Lost Something
                </Button>
              </Link>
              <Link href="/report/new?type=found">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white/15 backdrop-blur-sm text-white border border-white/20 hover:bg-white/25 font-semibold h-12 px-8 text-base transition-all hover:scale-105"
                  id="hero-found-btn"
                >
                  🎉 I Found Something
                </Button>
              </Link>
            </div>
            <div className="mt-8 animate-fade-in-up delay-400">
              <Link href="/browse" className="text-white/50 hover:text-white font-medium transition-colors inline-flex items-center gap-1.5">
                Browse all found items
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Extra padding at bottom for the stats cards to overlap into */}
        <div className="pb-28" />
      </section>

      {/* Stats Section — floats over the hero/white boundary */}
      <section className="relative z-10 -mt-24 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { value: totalReports, label: "Total Reports", icon: "📋", gradient: "from-indigo-500 to-blue-500" },
              { value: resolvedReports, label: "Items Recovered", icon: "✅", gradient: "from-emerald-500 to-teal-500" },
              { value: activeFoundItems, label: "Active Found Items", icon: "🔍", gradient: "from-violet-500 to-purple-500" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-6 text-center shadow-xl shadow-black/8 border border-border/60 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                style={{ animationDelay: `${(i + 1) * 150}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} mx-auto flex items-center justify-center text-xl shadow-lg mb-3`}>
                  {stat.icon}
                </div>
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Three simple steps to recover your lost items</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Report", desc: "Quickly report your lost or found item with details and location", icon: "📝", gradient: "from-blue-500 to-indigo-500" },
              { step: "2", title: "Match", desc: "Our algorithm matches lost items with found items automatically", icon: "🔗", gradient: "from-indigo-500 to-violet-500" },
              { step: "3", title: "Recover", desc: "Connect with the finder, verify ownership, and get your item back", icon: "🎉", gradient: "from-violet-500 to-purple-500" },
            ].map((item, i) => (
              <Card key={item.step} className={`text-center card-hover border-border/50 relative overflow-hidden animate-fade-in-up delay-${(i + 1) * 200}`}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient}`} />
                <CardHeader className="pb-2">
                  <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} mx-auto flex items-center justify-center text-2xl rounded-2xl shadow-lg`}>
                    {item.icon}
                  </div>
                  <CardTitle className="mt-4 text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Found Items */}
      {recentItems.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-background to-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Recently Found Items</h2>
                <p className="text-muted-foreground text-sm mt-1">Someone might have found what you&apos;re looking for</p>
              </div>
              <Link href="/browse" className="text-primary font-medium hover:underline hidden sm:inline-flex items-center gap-1">
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentItems.map((item) => (
                <ReportCard key={item.id} report={item} showClaimButton />
              ))}
            </div>
            <div className="sm:hidden mt-6 text-center">
              <Link href="/browse">
                <Button variant="outline" className="w-full">View All Items</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to recover your lost item?</h2>
          <p className="mt-4 text-white/60 max-w-md mx-auto">
            Join our community and increase your chances of finding what you lost.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-indigo-700 hover:bg-white/90 shadow-xl shadow-black/20 font-semibold h-12 px-8 text-base transition-all hover:scale-105"
                id="cta-signup"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
