import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";
import { Navbar } from "@/components/Navbar";

export default function SignupPage() {
  return (
    <main className="app-shell">
      <Navbar />
      <AuthForm mode="signup" />
      <Footer />
    </main>
  );
}
