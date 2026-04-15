import Link from "next/link";
import { db } from "@/db";
import { reports, categories } from "@/db/schema";
import { eq, and, or, ilike, desc, count } from "drizzle-orm";
import { ReportCard } from "@/components/reports/ReportCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

interface BrowsePageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    page?: string;
  }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const limit = 12;

  // Get all categories
  const allCategories = await db.select().from(categories).orderBy(categories.name);

  // Build filters
  const conditions = [eq(reports.type, "FOUND"), eq(reports.status, "ACTIVE")];
  if (params.categoryId) {
    conditions.push(eq(reports.categoryId, params.categoryId));
  }

  // Get items with search
  let items;
  let total;

  if (params.search) {
    const searchCondition = or(
      ilike(reports.title, `%${params.search}%`),
      ilike(reports.description, `%${params.search}%`)
    );

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: reports.id, type: reports.type, title: reports.title,
          description: reports.description, status: reports.status,
          createdAt: reports.createdAt, imageUrl: reports.imageUrl,
          categoryName: categories.name, categoryIcon: categories.icon,
        })
        .from(reports)
        .leftJoin(categories, eq(reports.categoryId, categories.id))
        .where(and(...conditions, searchCondition))
        .orderBy(desc(reports.createdAt))
        .offset((currentPage - 1) * limit)
        .limit(limit),
      db
        .select({ value: count() })
        .from(reports)
        .where(and(...conditions, searchCondition)),
    ]);

    items = rows;
    total = totalRows[0]?.value ?? 0;
  } else {
    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: reports.id, type: reports.type, title: reports.title,
          description: reports.description, status: reports.status,
          createdAt: reports.createdAt, imageUrl: reports.imageUrl,
          categoryName: categories.name, categoryIcon: categories.icon,
        })
        .from(reports)
        .leftJoin(categories, eq(reports.categoryId, categories.id))
        .where(and(...conditions))
        .orderBy(desc(reports.createdAt))
        .offset((currentPage - 1) * limit)
        .limit(limit),
      db
        .select({ value: count() })
        .from(reports)
        .where(and(...conditions)),
    ]);

    items = rows;
    total = totalRows[0]?.value ?? 0;
  }

  const totalPages = Math.ceil(total / limit);

  const formattedItems = items.map(item => ({
    id: item.id, type: item.type, title: item.title,
    description: item.description, status: item.status,
    createdAt: item.createdAt, imageUrl: item.imageUrl,
    category: item.categoryName ? { name: item.categoryName, icon: item.categoryIcon } : null,
  }));

  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams();
    const merged = { ...params, ...newParams };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) urlParams.set(key, value);
    });
    return `/browse?${urlParams.toString()}`;
  };

  const selectedCategory = allCategories.find(c => c.id === params.categoryId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Found Items
          {params.search && (
            <span className="text-muted-foreground font-normal text-lg sm:text-xl"> matching &quot;{params.search}&quot;</span>
          )}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{total} item{total !== 1 ? "s" : ""} available</p>
      </div>

      {/* Mobile: Category pills (horizontal scrollable) */}
      <div className="md:hidden mb-4 -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <Link
            href={buildUrl({ categoryId: undefined, page: undefined })}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !params.categoryId
                ? "gradient-primary text-white shadow-sm shadow-primary/20"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            All
          </Link>
          {allCategories.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl({ categoryId: cat.id, page: undefined })}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                params.categoryId === cat.id
                  ? "gradient-primary text-white shadow-sm shadow-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat.icon} {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile: Search bar */}
      <div className="md:hidden mb-6">
        <form className="flex gap-2">
          <Input
            type="text"
            name="search"
            defaultValue={params.search}
            placeholder="Search items..."
            className="h-11 flex-1"
          />
          <Button type="submit" size="sm" className="h-11 px-4 gradient-primary text-white border-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Button>
        </form>
        {(params.search || params.categoryId) && (
          <Link href="/browse" className="inline-block mt-2 text-xs text-destructive hover:underline">
            Clear all filters ✕
          </Link>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="border border-border/60 rounded-xl bg-card p-5 sticky top-24 shadow-sm">
            <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Filters</h2>

            {/* Search */}
            <form className="mb-6">
              <label className="block text-sm font-medium mb-1.5">Search</label>
              <Input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="Search items..."
                className="h-10"
              />
              <Button type="submit" size="sm" className="w-full mt-2 gradient-primary text-white border-0">
                Search
              </Button>
            </form>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                <Link
                  href={buildUrl({ categoryId: undefined, page: undefined })}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    !params.categoryId ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                  }`}
                >
                  All Categories
                </Link>
                {allCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={buildUrl({ categoryId: cat.id, page: undefined })}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      params.categoryId === cat.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {(params.search || params.categoryId) && (
              <Link href="/browse" className="block mt-4 text-center text-sm text-destructive hover:underline">
                Clear all filters ✕
              </Link>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {formattedItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {formattedItems.map((item) => (
                  <ReportCard key={item.id} report={item} showClaimButton />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {currentPage > 1 && (
                    <Link href={buildUrl({ page: String(currentPage - 1) })}>
                      <Button variant="outline" size="sm" className="h-10 px-4">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </Button>
                    </Link>
                  )}
                  <span className="px-4 py-2 text-sm text-muted-foreground font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <Link href={buildUrl({ page: String(currentPage + 1) })}>
                      <Button variant="outline" size="sm" className="h-10 px-4">
                        Next
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 border border-dashed border-border/60 rounded-xl bg-muted/30">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-muted-foreground mb-3 font-medium">No found items match your criteria</p>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
              <Link href="/browse">
                <Button variant="outline" className="px-6">Clear Filters</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
