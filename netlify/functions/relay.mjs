// Tiny same-site relay for playlist imports — fetches allowed hosts server-side
// and returns the body with CORS open. Locked to an allowlist so it can't be
// abused as an open proxy.
const ALLOWED = new Set(["open.spotify.com", "www.youtube.com", "music.youtube.com", "youtube.com"]);

export default async (req) => {
  const target = new URL(req.url).searchParams.get("url");
  let u;
  try { u = new URL(target); } catch { return new Response("bad url", { status: 400 }); }
  if (u.protocol !== "https:" || !ALLOWED.has(u.hostname))
    return new Response("host not allowed", { status: 403 });
  try {
    const r = await fetch(u, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        "Accept-Language": "en-US,en",
      },
      redirect: "follow",
    });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": r.headers.get("content-type") || "text/html",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    return new Response("upstream failed", { status: 502, headers: { "Access-Control-Allow-Origin": "*" } });
  }
};

export const config = { path: "/relay" };
