"use client";

import Form from "next/form";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Search, X } from "lucide-react";
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
  const [value, setValue] = useState(query);

  useEffect(() => {
    setValue(query);
  }, [query]);

  return (
    <Form action="/protected" className="space-y-2" role="search">
      <Label htmlFor="book-query">Search books</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Input
            id="book-query"
            name="q"
            type="text"
            placeholder="Title, author, or ISBN"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={MAX_QUERY_LENGTH}
            className="w-full bg-background pr-10"
            aria-describedby="book-search-hint"
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-primary transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          )}
        </div>
        <SearchButton />
      </div>
      <p id="book-search-hint" className="text-xs text-muted-foreground">
        Discover books with Google Books. Select a result to see its details.
      </p>
    </Form>
  );
}
