import { useLanguage } from "@/contexts/LanguageContext";
import { Hero } from "@/components/home/Hero";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { LatestPosts } from "@/components/home/LatestPosts";
import { WhatIDo } from "@/components/home/WhatIDo";
import { useSeo } from "@/lib/seo";

export function HomePage() {
  const { lang } = useLanguage();
  useSeo(null, null, lang);
  return (
    <>
      <Hero />
      <FeaturedProjects />
      <LatestPosts />
      <WhatIDo />
    </>
  );
}