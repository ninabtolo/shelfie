import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function ProfileSearchForm({ query }: { query: string }) {
  return (
    <form className="flex flex-col gap-2 sm:flex-row" action="/protected/profiles" role="search">
      <Input name="q" defaultValue={query} placeholder="Search by username" aria-label="Username" className="flex-1 bg-background" />
      <Button type="submit"><Search aria-hidden="true" /> Search</Button>
    </form>
  );
}
