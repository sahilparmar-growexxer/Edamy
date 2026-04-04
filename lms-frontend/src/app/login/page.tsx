import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  return (
    <main className="app-shell">
      <Navbar />
      <AuthForm mode="login" />
      <Footer />
    </main>
  );
}
