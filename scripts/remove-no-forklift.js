const fs = require('fs');

const catalogPath = '/home/user/Loadr/src/data/company-catalog.ts';
let content = fs.readFileSync(catalogPath, 'utf8');

// Find all seed objects in catalogSeeds array
// Each entry starts with "  {" and ends with "  },"
// We need to remove entries that have kind: "carrier" AND forkliftConfirmed: false

const seedsStart = content.indexOf('const catalogSeeds: CatalogSeed[] = [');
const seedsEnd = content.lastIndexOf('];');

const before = content.slice(0, seedsStart);
const seedsSection = content.slice(seedsStart, seedsEnd + 2);
const after = content.slice(seedsEnd + 2);

// Parse individual entries - split by the pattern of closing "  }," followed by "  {"
const entries = [];
let depth = 0;
let currentEntry = '';
let inArray = false;
const lines = seedsSection.split('\n');

let headerLines = [];
let footerLine = '';
let entryLines = [];
let currentEntryLines = [];
let collectingEntries = false;

for (const line of lines) {
  if (!collectingEntries) {
    if (line.trim() === '{' || (line.trim().startsWith('{') && !line.includes('const'))) {
      collectingEntries = true;
      currentEntryLines = [line];
    } else {
      headerLines.push(line);
    }
  } else {
    currentEntryLines.push(line);
    if (line.trim() === '},' || line.trim() === '}') {
      entryLines.push(currentEntryLines.join('\n'));
      currentEntryLines = [];
    }
  }
}

console.log('Total entries parsed:', entryLines.length);

// Filter out carrier entries with forkliftConfirmed: false
const filtered = entryLines.filter(entry => {
  const isCarrier = entry.includes('kind: "carrier"');
  const noForklift = entry.includes('forkliftConfirmed: false');
  if (isCarrier && noForklift) {
    // Extract name for logging
    const nameMatch = entry.match(/name:\s*"([^"]+)"/);
    console.log('  Removing:', nameMatch ? nameMatch[1] : 'unknown');
    return false;
  }
  return true;
});

console.log('Entries after filtering:', filtered.length);
console.log('Removed:', entryLines.length - filtered.length);

// Reconstruct
const newContent = headerLines.join('\n') + '\n' + filtered.join('\n') + '\n];' + after;
fs.writeFileSync(catalogPath, newContent);
console.log('Done!');
