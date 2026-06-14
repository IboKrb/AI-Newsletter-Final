import { useAuth } from "@/hooks/useAuth";
import HeroSection from "@/sections/HeroSection";
import NewsSection from "@/sections/NewsSection";
import ToolsSection from "@/sections/ToolsSection";
import PromptSection from "@/sections/PromptSection";
import ImageGenSection from "@/sections/ImageGenSection";
import TutorialSection from "@/sections/TutorialSection";
import PodcastSection from "@/sections/PodcastSection";
import VideoSection from "@/sections/VideoSection";
import ReadSection from "@/sections/ReadSection";
import PricingSection from "@/sections/PricingSection";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar user={user} isLoading={isLoading} />
      <main>
        <HeroSection />
        <NewsSection />
        <ToolsSection />
        <PromptSection />
        <ImageGenSection />
        <TutorialSection />
        <PodcastSection />
        <VideoSection />
        <ReadSection />
        <PricingSection userTier={user?.tier || "free"} />
      </main>
      <Footer />
    </div>
  );
}
