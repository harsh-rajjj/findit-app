import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateReportForm } from "@/components/reports/CreateReportForm";

async function getCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function NewReportPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/report/new");
  }

  const categories = await getCategories();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Create a Report
      </h1>
      <div className="border border-gray-200 bg-white p-6">
        <CreateReportForm categories={categories} />
      </div>
    </div>
  );
}
