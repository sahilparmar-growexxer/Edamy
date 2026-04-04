import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CreateCourseForm } from "@/components/CreateCourseForm";

type CreateCoursePageProps = {
  searchParams?: Promise<{
    educatorId?: string;
  }>;
};

export default async function CreateCoursePage({
  searchParams,
}: CreateCoursePageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="app-shell">
      <Navbar active="educator" />

      <section className="section-space">
        <div className="app-container">
          <div className="mb-8 max-w-3xl">
            <span className="pill-chip">Educator tools</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Create a new course
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Set up your next course with a clean publishing flow, then send learners back to a sharper dashboard.
            </p>
          </div>

          <CreateCourseForm educatorId={params?.educatorId} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
