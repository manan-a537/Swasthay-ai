import { PropsWithChildren } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6fbf8] to-[#f0f7fb] dark:from-[#071226] dark:to-[#031018] text-[#06202a] dark:text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(600px_400px_at_10%_10%,rgba(200,223,170,0.12),transparent),radial-gradient(500px_360px_at_90%_20%,rgba(151,205,229,0.08),transparent)] opacity-90" />
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">{children}</main>
      <Footer />
      <ThemeToggle />
    </div>
  );
}
