import {
  BookOpen,
  BookMarked,
  Heart,
  MessageSquareText,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReadingStatsData = {
  total_books: number;
  books_read: number;
  books_reading: number;
  books_abandoned: number;
  favorite_books: number;
  pages_read: number;
  rated_books: number;
  reviews_written: number;
  average_rating: number | null;
};

type StatusRow = { status: string; book_count: number };
type RatingRow = { rating: number; rating_count: number };
type NamedCount = { genre?: string; author?: string; book_count: number };
type ActivityRow = { month: string; books_added: number; reviews_written: number };

export type ReadingStatsProps = {
  stats: ReadingStatsData;
  statusData: StatusRow[];
  ratings: RatingRow[];
  genres: NamedCount[];
  authors: NamedCount[];
  activity: ActivityRow[];
};

const statusLabels: Record<string, string> = {
  reading: "Reading",
  read: "Read",
  abandoned: "Abandoned",
};

const statusColors: Record<string, string> = {
  reading: "hsl(197 62% 58%)",
  read: "hsl(329 62% 63%)",
  abandoned: "hsl(270 18% 58%)",
};

const chartColors = [
  "hsl(329 62% 63%)",
  "hsl(197 62% 58%)",
  "hsl(270 55% 70%)",
  "hsl(43 74% 62%)",
  "hsl(12 70% 66%)",
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function numericValue(value: number | null) {
  return value === null ? null : Number(value);
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(`${value}T00:00:00`));
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof BookOpen;
}) {
  return (
    <Card className="reading-stat-card">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="reading-stat-icon" aria-hidden="true">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusChart({ data }: { data: StatusRow[] }) {
  const total = data.reduce((sum, item) => sum + item.book_count, 0);
  let offset = 0;
  const segments = data.map((item) => {
    const start = offset;
    offset += total ? (item.book_count / total) * 100 : 0;
    return `${statusColors[item.status] ?? chartColors[0]} ${start}% ${offset}%`;
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
      <div
        className="reading-donut"
        style={{ background: total ? `conic-gradient(${segments.join(", ")})` : "hsl(var(--muted))" }}
        role="img"
        aria-label={`${formatNumber(total)} books by reading status`}
      >
        <div className="reading-donut-hole">
          <strong>{formatNumber(Number(total))}</strong>
          <span>books</span>
        </div>
      </div>
      <ul className="w-full max-w-[12rem] space-y-3 text-sm">
        {data.map((item) => (
          <li key={item.status} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: statusColors[item.status] }} aria-hidden="true" />
              {statusLabels[item.status] ?? item.status}
            </span>
            <strong>{Number(item.book_count)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RatingChart({ data }: { data: RatingRow[] }) {
  const max = Math.max(...data.map((item) => item.rating_count), 1);

  return (
    <div className="space-y-3">
      {[...data].reverse().map((item) => (
        <div key={item.rating} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-sm">
          <span className="reading-stars" aria-label={`${item.rating} out of 5 stars`}>
            {"★".repeat(item.rating)}
            <span className="reading-stars-muted">{"★".repeat(5 - item.rating)}</span>
          </span>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(item.rating_count / max) * 100}%` }} />
          </div>
          <span className="text-right font-medium">{item.rating_count}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityChart({ data }: { data: ActivityRow[] }) {
  const max = Math.max(...data.flatMap((item) => [item.books_added, item.reviews_written]), 1);

  return (
    <div>
      <div className="reading-activity-chart" aria-label="Books added and reviews written over the last 12 months">
        {data.map((item) => (
          <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end justify-center gap-1 px-0.5 sm:gap-2">
              <div className="reading-activity-bar bg-primary" style={{ height: `${(item.books_added / max) * 100}%` }} title={`${item.books_added} books added`} />
              <div className="reading-activity-bar bg-[hsl(197_62%_58%)]" style={{ height: `${(item.reviews_written / max) * 100}%` }} title={`${item.reviews_written} reviews written`} />
            </div>
            <span className="text-[0.65rem] text-muted-foreground">{monthLabel(item.month)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" />Books added</span>
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[hsl(197_62%_58%)]" />Reviews written</span>
      </div>
    </div>
  );
}

function RankedList({ items, labelKey }: { items: NamedCount[]; labelKey: "genre" | "author" }) {
  const max = Math.max(...items.map((item) => item.book_count), 1);

  return items.length ? (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item[labelKey]}-${index}`} className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-2 text-sm">
          <span className="text-xs text-muted-foreground">{index + 1}</span>
          <div className="min-w-0">
            <div className="mb-1 flex justify-between gap-2">
              <span className="truncate">{item[labelKey]}</span>
              <strong>{Number(item.book_count)}</strong>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary/70" style={{ width: `${(item.book_count / max) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <p className="text-sm text-muted-foreground">No data yet.</p>
  );
}

export function ReadingStats({ stats, statusData, ratings, genres, authors, activity }: ReadingStatsProps) {
  return (
    <section className="reading-stats space-y-5" aria-label="Reading stats">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Books" value={formatNumber(Number(stats.total_books))} icon={BookOpen} />
        <StatCard label="Pages read" value={formatNumber(Number(stats.pages_read))} icon={BookMarked} />
        <StatCard label="Average rating" value={numericValue(stats.average_rating)?.toFixed(2) ?? "—"} icon={Star} />
        <StatCard label="Favorites" value={formatNumber(Number(stats.favorite_books))} icon={Heart} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Books by status</CardTitle></CardHeader>
          <CardContent><StatusChart data={statusData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rating distribution</CardTitle></CardHeader>
          <CardContent><RatingChart data={ratings} /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Library & review activity</CardTitle>
            <p className="text-sm text-muted-foreground">{stats.reviews_written} reviews across {stats.rated_books} rated books</p>
          </CardHeader>
          <CardContent><ActivityChart data={activity} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top genres</CardTitle></CardHeader>
          <CardContent><RankedList items={genres} labelKey="genre" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Most-read authors</CardTitle></CardHeader>
          <CardContent><RankedList items={authors} labelKey="author" /></CardContent>
        </Card>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <MessageSquareText className="size-3.5" aria-hidden="true" />
        Activity shows books added and reviews written; it does not estimate when a book was finished.
      </p>
    </section>
  );
}
