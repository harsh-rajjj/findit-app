import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { CreateReportForm } from "@/components/reports/CreateReportForm";

export default async function NewReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/report/new");

  const allCategories = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Create Report</h1>
      <CreateReportForm categories={allCategories} />
    </div>
  );
}
