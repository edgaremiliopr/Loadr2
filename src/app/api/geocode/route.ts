import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 3) return NextResponse.json([]);

  const params = new URLSearchParams({
    format: "json",
    countrycodes: "us",
    limit: "6",
    q,
    viewbox: "-87.63,31.00,-80.03,24.40",
    bounded: "0",
    addressdetails: "1",
  });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "Loadr-App/1.0 (loadr.pro)",
        },
        next: { revalidate: 300 },
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
