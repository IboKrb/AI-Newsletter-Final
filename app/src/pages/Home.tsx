import { useAuth } from "@/hooks/useAuth";
import HeroSection from "@/sections/HeroSection";
import PricingSection from "@/sections/PricingSection";
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
        <PricingSection userTier={user?.tier || "free"} />
      </main>
      <Footer />
    </div>
  );
}
