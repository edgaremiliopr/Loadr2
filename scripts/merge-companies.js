const fs = require('fs');

// Read existing company catalog to get IDs already present
const catalogFile = fs.readFileSync('/home/user/Loadr/src/data/company-catalog.ts', 'utf8');
const existingIds = new Set();
const idMatches = catalogFile.matchAll(/id:\s*"([^"]+)"/g);
for (const m of idMatches) existingIds.add(m[1]);
console.log('Existing company IDs:', existingIds.size);

// Read carrier JSON
const carriers = require('/home/user/Loadr/research/florida_carrier_companies.json');
console.log('Total carriers from JSON:', carriers.length);

const newCarrierSeeds = [];
for (const c of carriers) {
  const id = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (existingIds.has(id)) continue;
  existingIds.add(id);

  newCarrierSeeds.push({
    id,
    kind: 'carrier',
    name: c.name,
    sector: c.category,
    address: c.address || `${c.city}, FL`,
    city: c.city,
    region: c.city,
    coverage: [c.city, 'Florida'],
    phone: c.phone || '',
    website: c.website || '',
    lat: c.lat,
    lon: c.lon,
    hasForklift: c.hasForklift || false,
    notes: c.notes || '',
  });
}
console.log('New carriers to add:', newCarrierSeeds.length);

// Generate TypeScript seeds for the new carriers
let output = '\n// ─── New carriers from research ───────────────────────────\n\n';

for (const c of newCarrierSeeds) {
  const coverageStr = c.coverage.map(cv => `"${cv}"`).join(', ');
  output += `  {
    id: "${c.id}",
    kind: "carrier",
    name: "${c.name.replace(/"/g, '\\"')}",
    sector: "${c.sector.replace(/"/g, '\\"')}",
    address: "${c.address.replace(/"/g, '\\"')}",
    city: "${c.city.replace(/"/g, '\\"')}",
    region: "${c.region.replace(/"/g, '\\"')}",
    coverage: [${coverageStr}],
    phone: "${c.phone}",
    website: "${c.website}",
    capabilities: [${c.hasForklift ? '"Forklift", "Flatbed delivery"' : '"Flatbed delivery"'}],
    workTypes: ["Construction freight", "Building materials"],
    tags: ["carrier"${c.hasForklift ? ', "forklift"' : ''}],
    fitScore: ${c.hasForklift ? 88 : 78},
    verification: "research" as const,
    forkliftConfirmed: ${c.hasForklift},
    forkliftEvidence: "${c.notes.replace(/"/g, '\\"').substring(0, 200)}",
    notes: "${c.notes.replace(/"/g, '\\"').substring(0, 200)}",
    opportunity: "Potential carrier for FL construction freight.",
    sourceLabel: "Web research",
    sourceNote: "Found via industry research",
  },\n`;
}

// Generate geocode entries
let geocodeOutput = '\n// ─── New carrier geocodes ─────────────────────────────────\n\n';
for (const c of newCarrierSeeds) {
  geocodeOutput += `  "${c.id}": { lat: ${c.lat}, lng: ${c.lon} },\n`;
}

fs.writeFileSync('/home/user/Loadr/research/new_carrier_seeds.ts', output);
fs.writeFileSync('/home/user/Loadr/research/new_carrier_geocodes.ts', geocodeOutput);

console.log('Written new_carrier_seeds.ts and new_carrier_geocodes.ts');
console.log('Done!');
