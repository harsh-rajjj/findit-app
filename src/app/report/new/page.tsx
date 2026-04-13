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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Report</h1>
        <p className="text-muted-foreground text-sm mt-1">Fill in the details to report a lost or found item</p>
      </div>
      <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-sm">
        <CreateReportForm categories={allCategories} />
      </div>
    </div>
  );
}
