import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import "./_components/home/animations.css";
import { HomeHeader } from "./_components/home/HomeHeader";
import { HomeHero } from "./_components/home/HomeHero";
import { HomeMarquee } from "./_components/home/HomeMarquee";
import { HomeTriggers } from "./_components/home/HomeTriggers";
import { HomeHowItWorks } from "./_components/home/HomeHowItWorks";
import { HomeValueProps } from "./_components/home/HomeValueProps";
import { HomeDmAutomation } from "./_components/home/HomeDmAutomation";
import { HomeFlows } from "./_components/home/HomeFlows";
import { HomeLeadsMagnets } from "./_components/home/HomeLeadsMagnets";
import { HomeAnalytics } from "./_components/home/HomeAnalytics";
import { HomeAccountsBand } from "./_components/home/HomeAccountsBand";
import { HomeCta } from "./_components/home/HomeCta";
import { HomeFooter } from "./_components/home/HomeFooter";
import { homeCssVars, homeWrapperClass } from "./_components/home/fonts";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className={homeWrapperClass} style={homeCssVars}>
      <HomeHeader />
      <HomeHero />
      <HomeMarquee />
      <HomeTriggers />
      <HomeHowItWorks />
      <HomeValueProps />
      <HomeDmAutomation />
      <HomeFlows />
      <HomeLeadsMagnets />
      <HomeAnalytics />
      <HomeAccountsBand />
      <HomeCta />
      <HomeFooter />
    </div>
  );
}
