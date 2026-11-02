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

async function tryInstagramBasicDisplay() {
  // Try to get from Instagram's public data
  try {
    const html = await fetchWithHeaders('https://www.instagram.com/luca.fb_ski/');
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});/);
    if (sharedDataMatch) {
      const data = JSON.parse(sharedDataMatch[1]);
      const user = data.entry_data?.ProfilePage?.[0]?.graphql?.user;
      if (user) {
        const followers = user.edge_followed_by?.count || null;
        let likes = 0;
        let views = 0;
        const posts = user.edge_owner_to_timeline_media?.edges || [];
        for (const post of posts) {
          likes += post.node.edge_liked_by?.count || 0;
          if (post.node.video_view_count) views += post.node.video_view_count;
        }
        return { followers, likes, views };
      }
    }
  } catch (e) {
    console.error('IG sharedData fetch failed:', e.message);
  }
  return null;
}

async function tryImginn() {
  try {
    const html = await fetchWithHeaders('https://imginn.com/luca.fb_ski/');
    const nums = extractNumbers(html);
    const sorted = [...new Set(nums)].filter(n => n > 10).sort((a,b) => b-a);
    if (sorted.length > 0) {
      return { followers: sorted.find(n => n > 100 && n < 50000) || null };
    }
  } catch (e) {}
  return null;
}

async function main() {
  let result = await tryInstagramBasicDisplay();
  if (!result) {
    result = await tryImginn();
  }
  
  if (!result) {
    console.log('Instagram fetch failed, skipping');
    return;
  }
  
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch (e) {}
  
  const totals = {
    ...existing,
    instagram: {
      likes: result.likes !== undefined && result.likes !== null ? result.likes : (existing.instagram?.likes ?? null),
      views: result.views !== undefined && result.views !== null ? result.views : (existing.instagram?.views ?? null),
      followers: result.followers !== undefined ? result.followers : (existing.instagram?.followers ?? null),
      updatedAt: new Date().toISOString()
    }
  };
  
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(totals, null, 2));
  console.log('Instagram stats updated:', totals.instagram);
}

main();
