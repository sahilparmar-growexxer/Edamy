import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EducatorDashboard } from "@/components/EducatorDashboard";

type EducatorDashboardPageProps = {
  searchParams?: Promise<{
    educatorId?: string;
  }>;
};

export default async function EducatorDashboardPage({
  searchParams,
}: EducatorDashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="app-shell">
      <Navbar active="educator" />
      <EducatorDashboard requestedEducatorId={params?.educatorId} />
      <Footer />
    </main>
  );
}
