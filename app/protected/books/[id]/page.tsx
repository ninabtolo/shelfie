import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { BookDetails } from "@/components/books/book-details";
import { Button } from "@/components/ui/button";
import { getBook, GoogleBooksError } from "@/lib/books/google-books";
import { bookSearchHref, parseBookSearch, type SearchParams } from "@/lib/books/search";

export const instant = false;

async function BookContent({ id }: { id: string }) {
  let book;
  try {
    book = await getBook(id);
  } catch (error) {
    if (!(error instanceof GoogleBooksError)) throw error;
    return <p role="alert" className="rounded-lg border p-6 text-sm text-destructive">{error.message}</p>;
  }
  if (!book) notFound();
  return <BookDetails book={book} />;
}

export default async function BookPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const { query, page } = parseBookSearch(search);

  return (
    <div className="space-y-6 py-8">
      <Button variant="ghost" asChild>
        <Link prefetch={false} href={bookSearchHref(query, page)}><ArrowLeft aria-hidden="true" />Back to search</Link>
      </Button>
      <Suspense key={id} fallback={<p role="status" className="py-8 text-muted-foreground">Loading book details…</p>}>
        <BookContent id={id} />
      </Suspense>
    </div>
  );
}
