import { useAuth } from "@/hooks/useAuth";
import HeroSection from "@/sections/HeroSection";
import PublishedFeed from "@/components/PublishedFeed";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar user={user} isLoading={isLoading} />
      <main>
        <HeroSection />
        <PublishedFeed />
      </main>
      <Footer />
    </div>
  );
}
