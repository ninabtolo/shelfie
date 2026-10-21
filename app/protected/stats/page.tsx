import { ReadingStats, type ReadingStatsProps } from "@/components/reading-stats";
import { ShelfieHero } from "@/components/shelfie-hero";
import { createClient } from "@/lib/supabase/server";

export default async function StatsPage() {
  const supabase = await createClient();
  const [
    statsResult,
    statusResult,
    ratingsResult,
    genresResult,
    authorsResult,
    activityResult,
  ] = await Promise.all([
    supabase.rpc("get_my_reading_stats"),
    supabase.rpc("get_my_book_status_distribution"),
    supabase.rpc("get_my_rating_distribution"),
    supabase.rpc("get_my_top_genres", { p_limit: 8 }),
    supabase.rpc("get_my_top_authors", { p_limit: 8 }),
    supabase.rpc("get_my_reading_activity"),
  ]);

  const statsError = [
    statsResult.error,
    statusResult.error,
    ratingsResult.error,
    genresResult.error,
    authorsResult.error,
    activityResult.error,
  ].find(Boolean);

  if (statsError) {
    throw new Error(`Could not load reading stats: ${statsError.message}`);
  }

  const readingStats = statsResult.data?.[0];
  if (!readingStats) {
    throw new Error("Could not load reading stats: no summary returned.");
  }

  return (
    <div className="space-y-8">
      <ShelfieHero title="Reading Stats" description="A closer look at your reading life." />
      <ReadingStats
        stats={readingStats as ReadingStatsProps["stats"]}
        statusData={statusResult.data ?? []}
        ratings={ratingsResult.data ?? []}
        genres={genresResult.data ?? []}
        authors={authorsResult.data ?? []}
        activity={activityResult.data ?? []}
      />
    </div>
  );
}
