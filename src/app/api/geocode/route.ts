import { NextRequest, NextResponse } from "next/server";

/* ── Unified result shape sent to the client ── */
interface GeoResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/* ── US Census Geocoder — best for US street addresses (free, no key) ── */

interface CensusMatch {
  matchedAddress: string;
  coordinates: { x: number; y: number };
  tigerLine: { tigerLineId: string };
}

async function searchCensus(q: string): Promise<GeoResult[]> {
  const params = new URLSearchParams({
    address: q,
    benchmark: "Public_AR_Current",
    format: "json",
  });

  const res = await fetch(
    `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${params}`,
    { next: { revalidate: 300 } }
  );
  const data = await res.json();
  const matches: CensusMatch[] = data?.result?.addressMatches ?? [];

  return matches.map((m, idx) => ({
    place_id: idx + 900000,
    display_name: m.matchedAddress,
    lat: String(m.coordinates.y),
    lon: String(m.coordinates.x),
  }));
}

/* ── Photon (komoot) — great for city / POI / landmark searches ── */

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

/* ── Nominatim — fallback for ZIP codes ── */

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

/* ── Detect if the query looks like a street address ── */
function looksLikeAddress(q: string): boolean {
  // Starts with a number followed by a word = likely a street address
  return /^\d+\s+\w/.test(q.trim());
}

/* ── Route handler — Census for addresses, Photon for cities, Nominatim fallback ── */

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  try {
    const isAddress = looksLikeAddress(q);

    // Run all sources in parallel
    const [censusResults, photonResults, nominatimResults] = await Promise.all([
      isAddress ? searchCensus(q).catch(() => [] as GeoResult[]) : Promise.resolve([]),
      searchPhoton(q).catch(() => [] as GeoResult[]),
      searchNominatim(q).catch(() => [] as GeoResult[]),
    ]);

    // Priority: Census (exact addresses) > Photon (cities/POIs) > Nominatim (ZIPs/fallback)
    let results: GeoResult[];
    if (censusResults.length > 0) {
      results = censusResults;
    } else if (photonResults.length > 0) {
      results = photonResults;
    } else {
      results = nominatimResults;
    }

    // Deduplicate by ~1km coordinate rounding
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
