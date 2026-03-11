import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { ReportCard } from "@/components/reports/ReportCard";

async function getStats() {
  try {
    const [totalReports, resolvedReports, activeFoundItems] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: "RESOLVED" } }),
      prisma.report.count({ where: { type: "FOUND", status: "ACTIVE" } }),
    ]);
    return { totalReports, resolvedReports, activeFoundItems };
  } catch {
    // Return zeros if database is not seeded yet
    return { totalReports: 0, resolvedReports: 0, activeFoundItems: 0 };
  }
}

async function getRecentFoundItems() {
  try {
    return await prisma.report.findMany({
      where: { type: "FOUND", status: "ACTIVE" },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const stats = await getStats();
  const recentItems = await getRecentFoundItems();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Lost Something?
              <br />
              <span className="text-blue-800">We&apos;ll Help You Find It.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              FindIt connects you with people who found your items. Report what
              you lost, and our intelligent matching system will notify you when
              a potential match is found.
            </p>

            {/* Quick Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/report/new?type=lost">
                <Button variant="danger" size="lg" className="w-full sm:w-auto">
                  I Lost Something
                </Button>
              </Link>
              <Link href="/report/new?type=found">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  I Found Something
                </Button>
              </Link>
            </div>

            {/* Search */}
            <div className="mt-8">
              <Link
                href="/browse"
                className="text-blue-800 font-medium hover:underline"
              >
                Browse all found items →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-gray-900">
                {stats.totalReports}
              </p>
              <p className="mt-1 text-gray-600">Total Reports</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-700">
                {stats.resolvedReports}
              </p>
              <p className="mt-1 text-gray-600">Items Recovered</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-800">
                {stats.activeFoundItems}
              </p>
              <p className="mt-1 text-gray-600">Active Found Items</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 mx-auto flex items-center justify-center text-2xl mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900">Report</h3>
              <p className="mt-2 text-sm text-gray-600">
                Quickly report your lost or found item with photos and location
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 mx-auto flex items-center justify-center text-2xl mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900">Match</h3>
              <p className="mt-2 text-sm text-gray-600">
                Our algorithm matches lost items with found items automatically
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 mx-auto flex items-center justify-center text-2xl mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900">Recover</h3>
              <p className="mt-2 text-sm text-gray-600">
                Connect with the finder and verify ownership to get your item back
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Found Items */}
      {recentItems.length > 0 && (
        <section>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Recently Found Items
              </h2>
              <Link
                href="/browse"
                className="text-blue-800 font-medium hover:underline"
              >
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

      {/* CTA Section */}
      <section className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-white">
            Ready to recover your lost item?
          </h2>
          <p className="mt-4 text-gray-400">
            Join our community and increase your chances of finding what you lost.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
