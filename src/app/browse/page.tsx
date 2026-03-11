import Link from "next/link";
import { db } from "@/db";
import { reports, categories } from "@/db/schema";
import { eq, and, or, ilike, desc, count } from "drizzle-orm";
import { ReportCard } from "@/components/reports/ReportCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    
    const rows = await db
      .select({
        id: reports.id, type: reports.type, title: reports.title,
        description: reports.description, status: reports.status,
        createdAt: reports.createdAt,
        categoryName: categories.name, categoryIcon: categories.icon,
      })
      .from(reports)
      .leftJoin(categories, eq(reports.categoryId, categories.id))
      .where(and(...conditions, searchCondition))
      .orderBy(desc(reports.createdAt))
      .offset((currentPage - 1) * limit)
      .limit(limit);

    const [totalRow] = await db
      .select({ value: count() })
      .from(reports)
      .where(and(...conditions, searchCondition));

    items = rows;
    total = totalRow.value;
  } else {
    const rows = await db
      .select({
        id: reports.id, type: reports.type, title: reports.title,
        description: reports.description, status: reports.status,
        createdAt: reports.createdAt,
        categoryName: categories.name, categoryIcon: categories.icon,
      })
      .from(reports)
      .leftJoin(categories, eq(reports.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(reports.createdAt))
      .offset((currentPage - 1) * limit)
      .limit(limit);

    const [totalRow] = await db
      .select({ value: count() })
      .from(reports)
      .where(and(...conditions));

    items = rows;
    total = totalRow.value;
  }

  const totalPages = Math.ceil(total / limit);

  const formattedItems = items.map(item => ({
    id: item.id, type: item.type, title: item.title,
    description: item.description, status: item.status,
    createdAt: item.createdAt,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="border rounded-md bg-card p-4">
            <h2 className="font-semibold mb-4">Filters</h2>

            {/* Search */}
            <form className="mb-6">
              <label className="block text-sm font-medium mb-1">Search</label>
              <Input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="Search items..."
              />
              <Button type="submit" size="sm" className="w-full mt-2">
                Search
              </Button>
            </form>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <div className="space-y-1">
                <Link
                  href={buildUrl({ categoryId: undefined, page: undefined })}
                  className={`block px-2 py-1 text-sm rounded ${
                    !params.categoryId ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                  }`}
                >
                  All Categories
                </Link>
                {allCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={buildUrl({ categoryId: cat.id, page: undefined })}
                    className={`block px-2 py-1 text-sm rounded ${
                      params.categoryId === cat.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {(params.search || params.categoryId) && (
              <Link href="/browse" className="block mt-4 text-center text-sm text-destructive hover:underline">
                Clear all filters
              </Link>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              Found Items
              {params.search && (
                <span className="text-muted-foreground font-normal"> matching &quot;{params.search}&quot;</span>
              )}
            </h1>
            <p className="text-muted-foreground">{total} item{total !== 1 ? "s" : ""}</p>
          </div>

          {formattedItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {formattedItems.map((item) => (
                  <ReportCard key={item.id} report={item} showClaimButton />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {currentPage > 1 && (
                    <Link href={buildUrl({ page: String(currentPage - 1) })}>
                      <Button variant="outline" size="sm">Previous</Button>
                    </Link>
                  )}
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <Link href={buildUrl({ page: String(currentPage + 1) })}>
                      <Button variant="outline" size="sm">Next</Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 border border-dashed rounded-md">
              <p className="text-muted-foreground mb-4">No found items match your criteria</p>
              <Link href="/browse">
                <Button variant="outline">Clear Filters</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
