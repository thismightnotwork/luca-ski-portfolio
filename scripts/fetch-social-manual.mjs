import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'data', 'social-totals.json');

function main() {
  // Keep existing values if they exist, otherwise set to null
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch (e) {}
  
  const totals = {
    instagram: {
      likes: existing.instagram?.likes ?? null,
      views: existing.instagram?.views ?? null,
      followers: existing.instagram?.followers ?? null,
      updatedAt: new Date().toISOString()
    },
    tiktok: {
      likes: existing.tiktok?.likes ?? 45000,
      views: existing.tiktok?.views ?? 2000000,
      followers: existing.tiktok?.followers ?? 945,
      updatedAt: new Date().toISOString()
    }
  };
  
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(totals, null, 2));
  console.log('Wrote', OUT);
}

main();
