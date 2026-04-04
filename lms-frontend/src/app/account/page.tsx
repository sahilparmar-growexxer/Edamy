import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { AccountProfile } from "@/components/AccountProfile";

export default function AccountPage() {
  return (
    <main className="app-shell">
      <Navbar active="account" />
      <AccountProfile />
      <Footer />
    </main>
  );
}
