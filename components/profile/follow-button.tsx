"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function FollowButton({
  username,
  initialFollowing,
}: {
  username: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleFollow() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc(
      following ? "unfollow_user" : "follow_user",
      { p_username: username },
    );

    if (rpcError) {
      setError("Could not update the follow. Please try again.");
      setPending(false);
      return;
    }

    setFollowing(!following);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" onClick={toggleFollow} disabled={pending}>
        {pending ? "Updating..." : following ? "Following" : "Follow"}
      </Button>
      {error && <p role="alert" className="text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
