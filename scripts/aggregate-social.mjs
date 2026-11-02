import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'data', 'social-totals.json');

async function main() {
  let totals = {};
  try {
    totals = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch (e) {}
  
  // Ensure structure
  if (!totals.instagram) totals.instagram = {};
  if (!totals.tiktok) totals.tiktok = {};
  if (!totals.youtube) totals.youtube = {};
  
  totals.lastUpdated = new Date().toISOString();
  
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(totals, null, 2));
  console.log('Aggregated social totals:', totals);
}

main();
