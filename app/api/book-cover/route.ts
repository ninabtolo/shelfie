import { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set([
  "books.google.com",
  "books.googleusercontent.com",
]);

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) return new Response("Missing image URL", { status: 400 });

  let imageUrl: URL;
  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return new Response("Invalid image URL", { status: 400 });
  }

  if (imageUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(imageUrl.hostname)) {
    return new Response("Image host is not allowed", { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: { Accept: "image/avif,image/webp,image/jpeg,image/png,image/*" },
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(8_000),
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType?.startsWith("image/")) {
      return new Response("Cover unavailable", { status: 404 });
    }

    return new Response(response.body, {
      headers: {
        "Cache-Control": "public, max-age=86_400, stale-while-revalidate=604_800",
        "Content-Type": contentType,
      },
    });
  } catch {
    return new Response("Cover unavailable", { status: 502 });
  }
}
