const fs = require('fs');

// 1. Insert shipper seeds into company-catalog.ts (before the closing ];)
const catalogPath = '/home/user/Loadr/src/data/company-catalog.ts';
let catalog = fs.readFileSync(catalogPath, 'utf8');
const seeds = fs.readFileSync('/home/user/Loadr/research/new_shipper_seeds.txt', 'utf8');

// Find the closing of catalogSeeds array
const closingBracket = catalog.lastIndexOf('];');
if (closingBracket === -1) { console.error('Could not find ]; in catalog'); process.exit(1); }
catalog = catalog.slice(0, closingBracket) + seeds + catalog.slice(closingBracket);

// Insert new city coordinates
const cities = fs.readFileSync('/home/user/Loadr/research/new_shipper_cities.txt', 'utf8');
// Find closing of cityCoordinates
const cityClosing = catalog.indexOf('};', catalog.indexOf('const cityCoordinates'));
if (cityClosing === -1) { console.error('Could not find cityCoordinates closing'); process.exit(1); }

// Filter out cities already in the catalog
const cityLines = cities.split('\n').filter(line => {
  const match = line.match(/"([^"]+)"/);
  if (!match) return false;
  // Check if this city already exists
  return !catalog.includes(`"${match[1]}":`);
});

if (cityLines.length > 0) {
  const cityInsert = cityLines.join('\n');
  catalog = catalog.slice(0, cityClosing) + cityInsert + '\n' + catalog.slice(cityClosing);
}

fs.writeFileSync(catalogPath, catalog);
console.log('Updated company-catalog.ts');

// 2. Insert geocodes into company-geocodes.ts
const geocodePath = '/home/user/Loadr/src/data/company-geocodes.ts';
let geocodes = fs.readFileSync(geocodePath, 'utf8');
const newGeocodes = fs.readFileSync('/home/user/Loadr/research/new_shipper_geocodes.txt', 'utf8');

const geoClosing = geocodes.lastIndexOf('};');
if (geoClosing === -1) { console.error('Could not find }; in geocodes'); process.exit(1); }

// Filter out geocodes already present
const geoLines = newGeocodes.split('\n').filter(line => {
  const match = line.match(/"([^"]+)"/);
  if (!match) return false;
  return !geocodes.includes(`"${match[1]}"`);
});

if (geoLines.length > 0) {
  geocodes = geocodes.slice(0, geoClosing) + geoLines.join('\n') + '\n' + geocodes.slice(geoClosing);
}

fs.writeFileSync(geocodePath, geocodes);
console.log('Updated company-geocodes.ts');
console.log('Done!');
