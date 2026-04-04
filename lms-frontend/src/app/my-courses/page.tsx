import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LearnerDashboard } from "@/components/LearnerDashboard";

type MyCoursesPageProps = {
  searchParams?: Promise<{
    studentId?: string;
  }>;
};

export default async function MyCoursesPage({ searchParams }: MyCoursesPageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="app-shell">
      <Navbar active="my-courses" />
      <LearnerDashboard requestedStudentId={params?.studentId} />
      <Footer />
    </main>
  );
}
