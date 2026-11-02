import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'data', 'social-totals.json');

async function fetchWithHeaders(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    return await res.text();
  } catch (e) {
    return '';
  }
}

function extractNumbers(text) {
  const numbers = [];
  const regex = /([0-9]{1,3}(?:,[0-9]{3})+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    numbers.push(parseInt(match[1].replace(/,/g, '')));
  }
  return numbers;
}

async function tryUrlebird() {
  try {
    const html = await fetchWithHeaders('https://urlebird.com/user/luca.fb_ski/');
    const followersMatch = html.match(/Followers[^\d]*([0-9,]+)/i);
    const likesMatch = html.match(/Likes[^\d]*([0-9,]+)/i);
    const viewsMatch = html.match(/Views[^\d]*([0-9,]+)/i);
    const nums = extractNumbers(html);
    const sorted = [...new Set(nums)].filter(n => n > 100).sort((a,b) => b-a);
    
    return {
      followers: followersMatch ? parseInt(followersMatch[1].replace(/,/g, '')) : (sorted.find(n => n > 500 && n < 2000) || null),
      likes: likesMatch ? parseInt(likesMatch[1].replace(/,/g, '')) : (sorted.find(n => n > 10000 && n < 100000) || sorted[1] || null),
      views: viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, '')) : (sorted.find(n => n > 1000000) || sorted[0] || null)
    };
  } catch (e) {}
  return null;
}

async function main() {
  let result = await tryUrlebird();
  
  if (!result) {
    console.log('TikTok fetch failed');
    return;
  }
  
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch (e) {}
  
  const totals = {
    ...existing,
    tiktok: {
      likes: result.likes,
      views: result.views,
      followers: result.followers ?? existing.tiktok?.followers ?? null,
      updatedAt: new Date().toISOString()
    }
  };
  
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(totals, null, 2));
  console.log('TikTok stats updated:', totals.tiktok);
}

main();
