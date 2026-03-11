import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReportCard } from "@/components/reports/ReportCard";
import { Button } from "@/components/ui/Button";
import type { Prisma } from "@prisma/client";

interface BrowsePageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    page?: string;
  }>;
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { name: "asc" },
  });
  return categories;
}

async function getFoundItems(params: {
  search?: string;
  categoryId?: string;
  page: number;
}) {
  const { search, categoryId, page } = params;
  const limit = 12;

  const where: Prisma.ReportWhereInput = {
    type: "FOUND",
    status: "ACTIVE",
    deletedAt: null,
  };

  if (categoryId) {
    // Include subcategories
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: true },
    });

    if (category) {
      const categoryIds = [category.id, ...category.children.map((c) => c.id)];
      where.categoryId = { in: categoryIds };
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  
  const [categories, { items, pagination }] = await Promise.all([
    getCategories(),
    getFoundItems({
      search: params.search,
      categoryId: params.categoryId,
      page: currentPage,
    }),
  ]);

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
          <div className="border border-gray-200 bg-white p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>

            {/* Search */}
            <form className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="Search items..."
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
              <Button type="submit" size="sm" className="w-full mt-2">
                Search
              </Button>
            </form>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="space-y-1">
                <Link
                  href={buildUrl({ categoryId: undefined, page: undefined })}
                  className={`block px-2 py-1 text-sm ${
                    !params.categoryId
                      ? "bg-blue-100 text-blue-800 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  All Categories
                </Link>
                {categories.map((category) => (
                  <div key={category.id}>
                    <Link
                      href={buildUrl({ categoryId: category.id, page: undefined })}
                      className={`block px-2 py-1 text-sm ${
                        params.categoryId === category.id
                          ? "bg-blue-100 text-blue-800 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {category.icon} {category.name}
                    </Link>
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={buildUrl({ categoryId: child.id, page: undefined })}
                        className={`block px-4 py-1 text-sm ${
                          params.categoryId === child.id
                            ? "bg-blue-100 text-blue-800 font-medium"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {child.icon} {child.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(params.search || params.categoryId) && (
              <Link
                href="/browse"
                className="block mt-4 text-center text-sm text-red-600 hover:underline"
              >
                Clear all filters
              </Link>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Found Items
              {params.search && (
                <span className="text-gray-500 font-normal">
                  {" "}
                  matching &quot;{params.search}&quot;
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {pagination.total} item{pagination.total !== 1 ? "s" : ""}
            </p>
          </div>

          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <ReportCard key={item.id} report={item} showClaimButton />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {currentPage > 1 && (
                    <Link href={buildUrl({ page: String(currentPage - 1) })}>
                      <Button variant="secondary" size="sm">
                        Previous
                      </Button>
                    </Link>
                  )}
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  {currentPage < pagination.totalPages && (
                    <Link href={buildUrl({ page: String(currentPage + 1) })}>
                      <Button variant="secondary" size="sm">
                        Next
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">No found items match your criteria</p>
              <Link href="/browse">
                <Button variant="secondary">Clear Filters</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
