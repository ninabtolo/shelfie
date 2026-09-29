import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BookNotFound() {
  return (
    <section className="space-y-4 py-8">
      <h1 className="text-2xl font-bold">Book not found</h1>
      <p className="text-muted-foreground">This book is no longer available on Google Books.</p>
      <Button variant="outline" asChild><Link href="/protected">Back to search</Link></Button>
    </section>
  );
}
