import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Shelfie — a magical reading space",
  description:
    "Build your library, rate and review what you read, keep a private wishlist, share books with other readers and get recommendations shaped by the way you read.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Signed-in readers go straight to their shelf; everyone else meets the landing page.
  if (data?.claims) redirect("/protected");

  return <LandingPage />;
}
