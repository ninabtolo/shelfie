import Link from "next/link";

export type FollowProfile = {
  follower_username: string;
  follower_avatar_url: string | null;
  follower_bio: string | null;
};

export type FollowingProfile = {
  following_username: string;
  following_avatar_url: string | null;
  following_bio: string | null;
};

export function FollowersList({
  profiles,
  count,
}: {
  profiles: FollowProfile[];
  count: number;
}) {
  return (
    <FollowDetails title="Followers" count={count} emptyMessage="You do not have any followers yet.">
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.follower_username}
          username={profile.follower_username}
          avatarUrl={profile.follower_avatar_url}
          bio={profile.follower_bio}
        />
      ))}
    </FollowDetails>
  );
}

export function FollowingList({
  profiles,
  count,
}: {
  profiles: FollowingProfile[];
  count: number;
}) {
  return (
    <FollowDetails title="Following" count={count} emptyMessage="You are not following anyone yet.">
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.following_username}
          username={profile.following_username}
          avatarUrl={profile.following_avatar_url}
          bio={profile.following_bio}
        />
      ))}
    </FollowDetails>
  );
}

function FollowDetails({
  title,
  count,
  emptyMessage,
  children,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer text-xl font-semibold">
        {title} <span className="text-muted-foreground">({count})</span>
      </summary>
      <div className="mt-4">
        {count ? (
          <ul className="grid gap-3 sm:grid-cols-2">{children}</ul>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">{emptyMessage}</p>
        )}
      </div>
    </details>
  );
}

function ProfileCard({
  username,
  avatarUrl,
  bio,
}: {
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}) {
  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-12 rounded-full object-cover" />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-lg font-semibold">
            {username[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <Link href={`/protected/profiles/${encodeURIComponent(username)}`} className="font-semibold hover:underline">
            @{username}
          </Link>
          <p className="line-clamp-1 text-sm text-muted-foreground">{bio || "No bio yet."}</p>
        </div>
      </div>
    </li>
  );
}
