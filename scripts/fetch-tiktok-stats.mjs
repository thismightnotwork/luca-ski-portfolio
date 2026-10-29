import fs from 'fs';
import path from 'path';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const TIKTOK_USERNAME = 'luca.fb_ski';

async function fetchStats() {
  if (!APIFY_TOKEN) {
    console.log('No APIFY_TOKEN found, skipping TikTok fetch');
    return;
  }

  try {
    const runRes = await fetch(`https://api.apify.com/v2/acts/clockworks~tiktok-scraper/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiles: [TIKTOK_USERNAME],
        resultsPerPage: 100,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false
      })
    });
    
    const run = await runRes.json();
    const runId = run.data?.id;
    
    if (!runId) {
      console.error('Failed to start TikTok Apify run:', run);
      return;
    }
    
    let status = run.data.status;
    while (status === 'READY' || status === 'RUNNING') {
      await new Promise(r => setTimeout(r, 5000));
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      const statusData = await statusRes.json();
      status = statusData.data.status;
      console.log('TikTok Apify run status:', status);
    }
    
    if (status !== 'SUCCEEDED') {
      console.error('TikTok Apify run failed:', status);
      return;
    }
    
    const datasetId = run.data.defaultDatasetId;
    const resultsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`);
    const results = await resultsRes.json();
    
    const totalLikes = results.reduce((sum, r) => sum + (r.diggCount || r.likes || r.stats?.diggCount || 0), 0);
    const totalViews = results.reduce((sum, r) => sum + (r.playCount || r.views || r.stats?.playCount || 0), 0);
    const followers = results[0]?.authorMeta?.fans || results[0]?.author?.fans || null;
    
    const stats = { followers, totalLikes, totalViews, totalPosts: results.length };
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
    fs.writeFileSync(
      path.join(process.cwd(), 'data/tiktok-stats.json'),
      JSON.stringify(stats, null, 2)
    );
    console.log('TikTok stats fetched:', stats);
  } catch (e) {
    console.error('Failed to fetch TikTok stats:', e);
  }
}

fetchStats();
