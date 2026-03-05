import { NextRequest, NextResponse } from "next/server";

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id: number;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    street?: string;
    housenumber?: string;
    type?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const params = new URLSearchParams({
    q,
    limit: "6",
    lang: "en",
    // Bias toward Florida bounding box
    bbox: "-87.63,24.40,-80.03,31.00",
  });

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?${params}`,
      {
        headers: { "User-Agent": "Loadr-App/1.0 (loadr.pro)" },
        next: { revalidate: 300 },
      }
    );
    const data: PhotonResponse = await res.json();

    // Normalize to a simple shape the calculator expects
    const results = data.features
      .filter((f) => {
        // Keep results in the US
        const country = f.properties.country ?? "";
        return country.includes("United States") || country === "USA";
      })
      .map((f) => {
        const p = f.properties;
        const [lon, lat] = f.geometry.coordinates;

        // Build a readable label
        const parts: string[] = [];
        if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
        else if (p.street) parts.push(p.street);
        else if (p.name) parts.push(p.name);
        if (p.city && p.city !== p.name) parts.push(p.city);
        if (p.state) parts.push(p.state);
        if (p.postcode) parts.push(p.postcode);

        return {
          place_id: f.properties.osm_id,
          display_name: parts.join(", "),
          lat: String(lat),
          lon: String(lon),
        };
      })
      .filter((r) => r.display_name.length > 0);

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
