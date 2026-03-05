import { NextRequest, NextResponse } from "next/server";

/* ── Unified result shape sent to the client ── */
interface GeoResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/* ── Photon (komoot) — great for city / POI searches ── */

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id: number;
    countrycode?: string;
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

async function searchPhoton(q: string): Promise<GeoResult[]> {
  const params = new URLSearchParams({
    q,
    limit: "6",
    lang: "en",
    lat: "28.0",
    lon: "-82.5",
  });

  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: { "User-Agent": "Loadr-App/1.0 (loadr.pro)" },
    next: { revalidate: 300 },
  });
  const data: { features: PhotonFeature[] } = await res.json();

  return data.features
    .filter((f) => (f.properties.countrycode ?? "") === "US")
    .map((f, idx) => {
      const p = f.properties;
      const [lon, lat] = f.geometry.coordinates;
      const parts: string[] = [];
      if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
      else if (p.street) parts.push(p.street);
      else if (p.name) parts.push(p.name);
      if (p.city && p.city !== p.name) parts.push(p.city);
      if (p.state) parts.push(p.state);
      if (p.postcode) parts.push(p.postcode);
      return {
        place_id: p.osm_id ?? idx,
        display_name: parts.join(", "),
        lat: String(lat),
        lon: String(lon),
      };
    })
    .filter((r) => r.display_name.length > 0);
}

/* ── Nominatim — better for ZIP codes & partial addresses ── */

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

async function searchNominatim(q: string): Promise<GeoResult[]> {
  const params = new URLSearchParams({
    format: "json",
    countrycodes: "us",
    limit: "6",
    q,
    addressdetails: "1",
    viewbox: "-87.63,31.00,-80.03,24.40",
    bounded: "0",
  });

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
  const data: NominatimResult[] = await res.json();

  return data.map((r) => {
    // Build a clean display name including street address when available
    const a = r.address;
    const parts: string[] = [];
    if (a?.house_number && a?.road) parts.push(`${a.house_number} ${a.road}`);
    else if (a?.road) parts.push(a.road);
    const city = a?.city ?? a?.town ?? a?.village ?? "";
    if (city) parts.push(city);
    if (a?.state) parts.push(a.state);
    if (a?.postcode) parts.push(a.postcode);
    const label = parts.length > 0 ? parts.join(", ") : r.display_name.split(",").slice(0, 3).join(",");

    return {
      place_id: r.place_id,
      display_name: label,
      lat: r.lat,
      lon: r.lon,
    };
  });
}

/* ── Route handler — try Photon first, fall back to Nominatim ── */

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  try {
    // Run both in parallel, prefer Photon but fall back to Nominatim
    const [photonResults, nominatimResults] = await Promise.all([
      searchPhoton(q).catch(() => [] as GeoResult[]),
      searchNominatim(q).catch(() => [] as GeoResult[]),
    ]);

    // Use Photon results if available, otherwise Nominatim
    const results = photonResults.length > 0 ? photonResults : nominatimResults;

    // Deduplicate by rounding coords to ~1km precision
    const seen = new Set<string>();
    const deduped = results.filter((r) => {
      const key = `${Number(r.lat).toFixed(2)},${Number(r.lon).toFixed(2)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json(deduped);
  } catch {
    return NextResponse.json([]);
  }
}
