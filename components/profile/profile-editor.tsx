"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const MAX_BIO_LENGTH = 300;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export function ProfileEditor({
  userId,
  username,
  initialBio,
  initialAvatarUrl,
}: {
  userId: string;
  username: string;
  initialBio: string;
  initialAvatarUrl: string | null;
}) {
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const file = form.avatar.files?.[0];

    if (file && (!allowedTypes.includes(file.type) || file.size > MAX_AVATAR_SIZE)) {
      setError("Choose a JPG, PNG, or WebP image up to 2 MB.");
      setPending(false);
      return;
    }

    let nextAvatarUrl = avatarUrl;
    if (file) {
      const path = `${userId}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError) {
        setError(`Could not upload your profile photo: ${uploadError.message}`);
        setPending(false);
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      nextAvatarUrl = `${data.publicUrl}?v=${Date.now()}`;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ bio: bio || null, avatar_url: nextAvatarUrl })
      .eq("id", userId);
    if (updateError) {
      setError("Could not save your profile. Please try again.");
    } else {
      setAvatarUrl(nextAvatarUrl);
      form.reset();
      setMessage("Profile saved.");
    }
    setPending(false);
  }

  return (
    <form onSubmit={saveProfile} className="space-y-5 rounded-xl border p-6">
      <div>
        <p className="text-sm text-muted-foreground">Username</p>
        <p className="mt-1 font-medium">@{username}</p>
      </div>
      {avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-20 rounded-full object-cover" />
      )}
      <div className="grid gap-2">
        <Label htmlFor="avatar">Profile photo</Label>
        <Input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
        <p className="text-xs text-muted-foreground">JPG, PNG, or WebP; maximum 2 MB.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          value={bio}
          maxLength={MAX_BIO_LENGTH}
          onChange={(event) => setBio(event.target.value)}
          rows={4}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <p className="text-right text-xs text-muted-foreground">{bio.length}/{MAX_BIO_LENGTH}</p>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
      {message && <p role="status" className="text-sm text-primary">{message}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
