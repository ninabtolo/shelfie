import { createClient } from "@/lib/supabase/server";
import { Mail, UsersRound } from "lucide-react";
import { ShelfieHero } from "@/components/shelfie-hero";
import { AiPersonalizationSettings } from "@/components/account/ai-personalization-settings";
import { ProfileEditor } from "@/components/profile/profile-editor";
import {
  FollowersList,
  FollowingList,
  type FollowProfile,
  type FollowingProfile,
} from "@/components/profile/follow-lists";

type FollowerRow = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

type FollowingRow = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "Not informed";
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) throw new Error("Could not load your account.");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, bio, avatar_url")
    .eq("id", userId)
    .single();
  if (error || !profile) throw new Error("Could not load your profile.");
  const { data: aiPreference, error: aiPreferenceError } = await supabase
    .from("ai_recommendation_preferences")
    .select("personalization_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (aiPreferenceError) throw new Error("Could not load AI settings.");
  const { data: followerRows, error: followersError } = await supabase.rpc("get_my_followers");
  if (followersError) throw new Error("Could not load your followers.");
  const followers = (followerRows as FollowerRow[] ?? []).map((follower) => ({
    follower_username: follower.username,
    follower_avatar_url: follower.avatar_url,
    follower_bio: follower.bio,
  })) as FollowProfile[];
  const { data: followingRows, error: followingError } = await supabase.rpc("get_my_following");
  if (followingError) throw new Error("Could not load who you follow.");
  const following = (followingRows as FollowingRow[] ?? []).map((profile) => ({
    following_username: profile.username,
    following_avatar_url: profile.avatar_url,
    following_bio: profile.bio,
  })) as FollowingProfile[];
  const { data: followStats, error: followStatsError } = await supabase
    .from("public_follow_stats")
    .select("followers_count, following_count")
    .eq("username", profile.username)
    .maybeSingle();
  if (followStatsError) throw new Error("Could not load follow counts.");

  return (
    <section className="flex flex-col gap-8">
      <ShelfieHero title="My account" description="Manage your profile and connections." />
      <AiPersonalizationSettings initialEnabled={aiPreference?.personalization_enabled ?? false} />
      <section className="space-y-4" aria-labelledby="connections-title">
        <h2 id="connections-title" className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground"><UsersRound aria-hidden="true" className="size-4 text-primary" /> My connections</h2>
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <FollowersList profiles={followers} count={followStats?.followers_count ?? followers.length} />
          <FollowingList profiles={following} count={followStats?.following_count ?? following.length} />
        </div>
        <div className="shelfie-rule" aria-hidden="true" />
      </section>
      <div className="shelfie-surface p-5 sm:p-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Mail aria-hidden="true" className="size-4" /> E-mail</p>
        <p className="mt-1 font-medium">{email}</p>
      </div>
      <ProfileEditor
        userId={userId}
        username={profile.username}
        initialBio={profile.bio ?? ""}
        initialAvatarUrl={profile.avatar_url}
      />
    </section>
  );
}
