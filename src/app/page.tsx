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
      category: item.categoryName ? { name: item.categoryName, icon: item.categoryIcon } : null,
    }));
  } catch { /* DB not ready */ }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-muted/50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Lost Something?
              <br />
              <span className="text-primary">We&apos;ll Help You Find It.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              FindIt connects you with people who found your items. Report what
              you lost, and our intelligent matching system will notify you when
              a potential match is found.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/report/new?type=lost">
                <Button variant="destructive" size="lg" className="w-full sm:w-auto">
                  I Lost Something
                </Button>
              </Link>
              <Link href="/report/new?type=found">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  I Found Something
                </Button>
              </Link>
            </div>
            <div className="mt-8">
              <Link href="/browse" className="text-primary font-medium hover:underline">
                Browse all found items →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold">{totalReports}</p>
              <p className="mt-1 text-muted-foreground">Total Reports</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-700">{resolvedReports}</p>
              <p className="mt-1 text-muted-foreground">Items Recovered</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">{activeFoundItems}</p>
              <p className="mt-1 text-muted-foreground">Active Found Items</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Report", desc: "Quickly report your lost or found item with details and location" },
              { step: "2", title: "Match", desc: "Our algorithm matches lost items with found items automatically" },
              { step: "3", title: "Recover", desc: "Connect with the finder and verify ownership to get your item back" },
            ].map((item) => (
              <Card key={item.step} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 text-primary mx-auto flex items-center justify-center text-2xl font-bold rounded-full">
                    {item.step}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Found Items */}
      {recentItems.length > 0 && (
        <section>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Recently Found Items</h2>
              <Link href="/browse" className="text-primary font-medium hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentItems.map((item) => (
                <ReportCard key={item.id} report={item} showClaimButton />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold">Ready to recover your lost item?</h2>
          <p className="mt-4 opacity-80">
            Join our community and increase your chances of finding what you lost.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button variant="secondary" size="lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
