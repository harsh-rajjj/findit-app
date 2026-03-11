import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditReportForm } from "@/components/reports/EditReportForm";

async function getReport(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: { category: true },
  });
}

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

interface EditReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditReportPage({ params }: EditReportPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/report/${id}/edit`);
  }

  const report = await getReport(id);

  if (!report || report.deletedAt) {
    notFound();
  }

  if (report.userId !== session.user.id) {
    redirect(`/report/${id}`);
  }

  const categories = await getCategories();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Report</h1>
      <div className="border border-gray-200 bg-white p-6">
        <EditReportForm
          reportId={report.id}
          categories={categories}
          initialData={{
            type: report.type,
            title: report.title,
            description: report.description,
            categoryId: report.categoryId,
            latitude: report.latitude,
            longitude: report.longitude,
            locationDescription: report.locationDescription,
            lostFoundDate: report.lostFoundDate.toISOString().split("T")[0],
            images: report.images,
            verificationQuestion: report.verificationQuestion,
          }}
        />
      </div>
    </div>
  );
}
