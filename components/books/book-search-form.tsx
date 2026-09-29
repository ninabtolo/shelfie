"use client";

import Form from "next/form";
import { useFormStatus } from "react-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_QUERY_LENGTH } from "@/lib/books/search";

function SearchButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Search aria-hidden="true" />
      {pending ? "Searching…" : "Search"}
    </Button>
  );
}

export function BookSearchForm({ query }: { query: string }) {
  return (
    <Form action="/protected" className="space-y-2" role="search">
      <Label htmlFor="book-query">Search books</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          key={query}
          id="book-query"
          name="q"
          type="search"
          placeholder="Title, author, or ISBN"
          defaultValue={query}
          maxLength={MAX_QUERY_LENGTH}
          className="flex-1"
          aria-describedby="book-search-hint"
        />
        <SearchButton />
      </div>
      <p id="book-search-hint" className="text-xs text-muted-foreground">
        Discover books with Google Books. Select a result to see its details.
      </p>
    </Form>
  );
}
