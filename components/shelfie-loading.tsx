function Skeleton({ className }: { className: string }) {
  return <div className={`shelfie-skeleton ${className}`} aria-hidden="true" />;
}

function LoadingStatus({ label }: { label: string }) {
  return <span className="sr-only" role="status">{label}</span>;
}

function LoadingBookCard() {
  return (
    <li className="shelfie-loading-card shelfie-surface p-4">
      <div className="flex gap-4">
        <Skeleton className="h-32 w-20 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-5 w-4/5 rounded" />
          <Skeleton className="h-4 w-3/5 rounded" />
          <Skeleton className="h-3 w-2/5 rounded" />
        </div>
      </div>
    </li>
  );
}

function LoadingProfileCard() {
  return (
    <li className="shelfie-loading-card shelfie-surface p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-5 w-2/5 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
        <Skeleton className="size-10 shrink-0 rounded-lg" />
      </div>
    </li>
  );
}

export function ProtectedLoading() {
  return (
    <div className="space-y-8">
      <LoadingStatus label="Loading Shelfie" />
      <div className="shelfie-loading-hero shelfie-surface space-y-3 p-8">
        <Skeleton className="mx-auto h-8 w-56 rounded-lg" />
        <Skeleton className="mx-auto h-4 w-72 max-w-full rounded" />
      </div>
      <div className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-full rounded-md sm:w-28" />
        </div>
        <div className="shelfie-rule" aria-hidden="true" />
        <div className="space-y-3 py-4">
          <Skeleton className="mx-auto h-8 w-8 rounded-full" />
          <Skeleton className="mx-auto h-6 w-72 max-w-full rounded" />
        </div>
      </div>
    </div>
  );
}

export function BookResultsLoading() {
  return (
    <section className="space-y-5" aria-label="Loading books">
      <LoadingStatus label="Loading books" />
      <Skeleton className="h-6 w-48 rounded" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <LoadingBookCard key={index} />)}
      </ul>
    </section>
  );
}

export function ProfilesLoading() {
  return (
    <div className="space-y-8">
      <LoadingStatus label="Loading profiles" />
      <div className="shelfie-loading-hero shelfie-surface space-y-3 p-8">
        <Skeleton className="mx-auto h-8 w-40 rounded-lg" />
        <Skeleton className="mx-auto h-4 w-64 max-w-full rounded" />
      </div>
      <div className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-full rounded-md sm:w-28" />
        </div>
        <div className="shelfie-rule" aria-hidden="true" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <LoadingProfileCard key={index} />)}
        </ul>
      </div>
    </div>
  );
}

export function BookDetailsLoading() {
  return (
    <div className="space-y-6 py-8">
      <LoadingStatus label="Loading book details" />
      <Skeleton className="h-9 w-36 rounded-md" />
      <div className="space-y-8">
        <div className="shelfie-loading-hero shelfie-surface space-y-3 p-8">
          <Skeleton className="mx-auto h-10 w-72 max-w-full rounded-lg" />
          <Skeleton className="mx-auto h-5 w-48 rounded" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[10rem_1fr]">
          <Skeleton className="h-56 w-36 rounded-md" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-4 w-3/5 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-11/12 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      </div>
    </div>
  );
}
