const fs = require('fs');

// Read existing company catalog to get IDs already present
const catalogFile = fs.readFileSync('/home/user/Loadr/src/data/company-catalog.ts', 'utf8');
const existingIds = new Set();
const idMatches = catalogFile.matchAll(/id:\s*"([^"]+)"/g);
for (const m of idMatches) existingIds.add(m[1]);
console.log('Existing company IDs:', existingIds.size);

// Read shipper JSON
const shippers = require('/home/user/Loadr/research/florida_shipper_companies.json');
console.log('Total shippers from JSON:', shippers.length);

// Read existing geocodes
const geocodeFile = fs.readFileSync('/home/user/Loadr/src/data/company-geocodes.ts', 'utf8');

// Read existing city coordinates
const cityCoordMatches = catalogFile.matchAll(/"?([^"{}]+)"?\s*:\s*\{\s*lat:\s*[\d.-]+,\s*lng:\s*[\d.-]+\s*\}/g);
const existingCities = new Set();
for (const m of cityCoordMatches) existingCities.add(m[1].trim());

const newShipperSeeds = [];
const newCities = new Map();

for (const s of shippers) {
  const id = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (existingIds.has(id)) { console.log('  Skip existing:', id); continue; }
  existingIds.add(id);

  const city = s.city || 'Tampa';
  if (!existingCities.has(city) && !newCities.has(city) && s.lat && s.lon) {
    newCities.set(city, { lat: s.lat, lng: s.lon });
  }

  // Determine coverage based on city
  const coverage = [city, 'Florida'];

  // Determine capabilities based on category
  const cat = (s.category || '').toLowerCase();
  let capabilities = ['Material supply'];
  let workTypes = ['Construction materials'];
  let tags = ['shipper'];
  let fitScore = 75;

  if (cat.includes('scaffold') || cat.includes('shoring')) {
    capabilities = ['Scaffolding supply', 'Shoring equipment'];
    workTypes = ['Scaffolding', 'Shoring', 'Construction equipment'];
    tags = ['shipper', 'scaffolding'];
    fitScore = 82;
  } else if (cat.includes('lumber') || cat.includes('building material')) {
    capabilities = ['Lumber supply', 'Building materials'];
    workTypes = ['Lumber delivery', 'Building materials', 'Construction supply'];
    tags = ['shipper', 'lumber'];
    fitScore = 80;
  } else if (cat.includes('roof')) {
    capabilities = ['Roofing materials', 'Distribution'];
    workTypes = ['Roofing supply', 'Building materials'];
    tags = ['shipper', 'roofing'];
    fitScore = 79;
  } else if (cat.includes('drywall') || cat.includes('insulation')) {
    capabilities = ['Drywall supply', 'Insulation materials'];
    workTypes = ['Drywall delivery', 'Insulation', 'Interior materials'];
    tags = ['shipper', 'drywall'];
    fitScore = 78;
  } else if (cat.includes('rebar') || cat.includes('reinforc')) {
    capabilities = ['Rebar fabrication', 'Reinforcing steel'];
    workTypes = ['Rebar delivery', 'Steel reinforcing'];
    tags = ['shipper', 'rebar'];
    fitScore = 81;
  } else if (cat.includes('steel') || cat.includes('metal')) {
    capabilities = ['Steel fabrication', 'Metal supply'];
    workTypes = ['Structural steel', 'Metal delivery'];
    tags = ['shipper', 'steel'];
    fitScore = 80;
  } else if (cat.includes('precast') || cat.includes('concrete')) {
    capabilities = ['Precast concrete', 'Concrete products'];
    workTypes = ['Precast delivery', 'Concrete products'];
    tags = ['shipper', 'precast'];
    fitScore = 83;
  } else if (cat.includes('brick') || cat.includes('mason') || cat.includes('block')) {
    capabilities = ['Masonry supply', 'Block & brick'];
    workTypes = ['Masonry materials', 'Block delivery'];
    tags = ['shipper', 'masonry'];
    fitScore = 77;
  } else if (cat.includes('plumb') || cat.includes('pipe')) {
    capabilities = ['Plumbing supply', 'Pipe & fittings'];
    workTypes = ['Plumbing materials', 'Pipe delivery'];
    tags = ['shipper', 'plumbing'];
    fitScore = 76;
  } else if (cat.includes('hvac') || cat.includes('mechanical')) {
    capabilities = ['HVAC equipment', 'Mechanical supply'];
    workTypes = ['HVAC delivery', 'Mechanical equipment'];
    tags = ['shipper', 'hvac'];
    fitScore = 76;
  } else if (cat.includes('glass') || cat.includes('window')) {
    capabilities = ['Glass supply', 'Window systems'];
    workTypes = ['Glass delivery', 'Window installation materials'];
    tags = ['shipper', 'glass'];
    fitScore = 77;
  } else if (cat.includes('landscape') || cat.includes('paver') || cat.includes('stone')) {
    capabilities = ['Landscape materials', 'Hardscape supply'];
    workTypes = ['Landscape delivery', 'Paver & stone'];
    tags = ['shipper', 'landscape'];
    fitScore = 74;
  } else if (cat.includes('solar')) {
    capabilities = ['Solar panel distribution', 'Renewable energy'];
    workTypes = ['Solar panel delivery', 'Energy materials'];
    tags = ['shipper', 'solar'];
    fitScore = 78;
  } else if (cat.includes('fenc')) {
    capabilities = ['Fencing supply', 'Perimeter materials'];
    workTypes = ['Fencing delivery', 'Site perimeter'];
    tags = ['shipper', 'fencing'];
    fitScore = 74;
  } else if (cat.includes('modular') || cat.includes('prefab')) {
    capabilities = ['Modular buildings', 'Prefab structures'];
    workTypes = ['Modular delivery', 'Prefab transport'];
    tags = ['shipper', 'modular'];
    fitScore = 80;
  } else if (cat.includes('hoist') || cat.includes('equipment') || cat.includes('trench')) {
    capabilities = ['Equipment rental', 'Heavy equipment'];
    workTypes = ['Equipment delivery', 'Construction equipment'];
    tags = ['shipper', 'equipment'];
    fitScore = 79;
  }

  newShipperSeeds.push({
    id,
    kind: 'shipper',
    name: s.name,
    sector: s.category || 'Construction materials',
    address: s.address || `${city}, FL`,
    city,
    region: city,
    coverage,
    phone: s.phone || '',
    website: s.website || '',
    lat: s.lat,
    lon: s.lon,
    capabilities,
    workTypes,
    tags,
    fitScore,
    notes: '',
  });
}
console.log('New shippers to add:', newShipperSeeds.length);
console.log('New cities to add:', newCities.size);

// Generate TypeScript seeds
let output = '\n// ─── Shipper companies from research ──────────────────────\n\n';
for (const s of newShipperSeeds) {
  const esc = (str) => (str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const coverageStr = s.coverage.map(cv => `"${esc(cv)}"`).join(', ');
  const capsStr = s.capabilities.map(c => `"${esc(c)}"`).join(', ');
  const workStr = s.workTypes.map(w => `"${esc(w)}"`).join(', ');
  const tagsStr = s.tags.map(t => `"${t}"`).join(', ');

  output += `  {
    id: "${s.id}",
    kind: "shipper",
    name: "${esc(s.name)}",
    sector: "${esc(s.sector)}",
    address: "${esc(s.address)}",
    city: "${esc(s.city)}",
    region: "${esc(s.region)}",
    coverage: [${coverageStr}],
    phone: "${esc(s.phone)}",
    website: "${esc(s.website)}",
    capabilities: [${capsStr}],
    workTypes: [${workStr}],
    tags: [${tagsStr}],
    fitScore: ${s.fitScore},
    verification: "research" as const,
    forkliftConfirmed: null,
    forkliftEvidence: "",
    notes: "Potential shipper for FL construction freight.",
    opportunity: "Potential shipper needing flatbed/specialized transport.",
    sourceLabel: "Web research",
    sourceNote: "Found via industry research",
  },\n`;
}

// Generate geocode entries
let geocodeOutput = '\n// ─── Shipper geocodes ─────────────────────────────────────\n\n';
for (const s of newShipperSeeds) {
  if (s.lat && s.lon) {
    geocodeOutput += `  "${s.id}": { lat: ${s.lat}, lng: ${s.lon} },\n`;
  }
}

// Generate city coordinate entries
let cityOutput = '\n// ─── New cities from shipper research ─────────────────────\n\n';
for (const [city, coords] of newCities) {
  cityOutput += `  "${city}": { lat: ${coords.lat}, lng: ${coords.lng} },\n`;
}

fs.writeFileSync('/home/user/Loadr/research/new_shipper_seeds.txt', output);
fs.writeFileSync('/home/user/Loadr/research/new_shipper_geocodes.txt', geocodeOutput);
fs.writeFileSync('/home/user/Loadr/research/new_shipper_cities.txt', cityOutput);

console.log('Written new_shipper_seeds.txt, new_shipper_geocodes.txt, new_shipper_cities.txt');
console.log('Done!');
