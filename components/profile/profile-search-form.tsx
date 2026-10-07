import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileSearchForm({ query }: { query: string }) {
  return (
    <form className="flex gap-2" action="/protected/profiles">
      <Input name="q" defaultValue={query} placeholder="Search by username" aria-label="Username" />
      <Button type="submit">Search</Button>
    </form>
  );
}
