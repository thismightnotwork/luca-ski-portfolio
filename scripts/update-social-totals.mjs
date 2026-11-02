import fs from 'fs';
import path from 'path';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const OUT = path.join(process.cwd(), 'data', 'social-totals.json');

async function update() {
  const totals = {
    instagram: { likes: 0, views: 0, followers: null, updatedAt: null },
    tiktok: { likes: 0, views: 0, followers: null, updatedAt: null }
  };

  try {
    if (APIFY_TOKEN) {
      // Try to fetch Instagram
      try {
        const igRes = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ directUrls: ['https://www.instagram.com/luca.fb_ski/'], resultsType: 'posts', resultsLimit: 200 })
        });
        const igRun = await igRes.json();
        if (igRun.data?.id) {
          let s = igRun.data.status;
          while (s === 'READY' || s === 'RUNNING') { await new Promise(r=>setTimeout(r,5000)); const sr = await fetch(`https://api.apify.com/v2/actor-runs/${igRun.data.id}?token=${APIFY_TOKEN}`); s = (await sr.json()).data.status; }
          if (s === 'SUCCEEDED') {
            const items = await (await fetch(`https://api.apify.com/v2/datasets/${igRun.data.defaultDatasetId}/items?token=${APIFY_TOKEN}`)).json();
            let likes=0, views=0;
            for (const r of items) {
              likes += Number(r.likesCount||r.likes||r.likeCount||0);
              views += Number(r.videoPlayCount||r.playCount||r.videoViewCount||r.videoViews||r.views||0);
            }
            totals.instagram = { likes, views, followers: null, updatedAt: new Date().toISOString() };
          }
        }
      } catch(e) { console.error('IG err', e.message); }
    }
  } catch(e) {}

  // Fallback to existing files
  try {
    const ig = JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/instagram-stats.json'),'utf8'));
    if (!totals.instagram.likes && ig.totalLikes) totals.instagram.likes = ig.totalLikes;
    if (!totals.instagram.views && ig.totalViews) totals.instagram.views = ig.totalViews;
  } catch(e){}
  try {
    const tt = JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/tiktok-stats.json'),'utf8'));
    if (!totals.tiktok.likes && tt.totalLikes) totals.tiktok.likes = tt.totalLikes;
    if (!totals.tiktok.views && tt.totalViews) totals.tiktok.views = tt.totalViews;
    if (!totals.tiktok.followers && tt.followers) totals.tiktok.followers = tt.followers;
    totals.tiktok.updatedAt = new Date().toISOString();
  } catch(e){}

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(totals, null, 2));
  console.log('Wrote', OUT, totals);
}

update();
