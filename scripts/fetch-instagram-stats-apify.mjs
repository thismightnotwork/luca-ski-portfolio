import fs from 'fs';
import path from 'path';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const INSTAGRAM_USERNAME = 'luca.fb_ski';
const REEL_URLS = [
  'https://www.instagram.com/reel/De-ZZVboXQR/',
  'https://www.instagram.com/reel/DemibnZIrBN/',
  'https://www.instagram.com/reel/DeY6onVo76f/'
];

async function fetchStats() {
  if (!APIFY_TOKEN) {
    console.log('No APIFY_TOKEN found, skipping Apify fetch');
    return;
  }

  try {
    // Use apify/instagram-scraper actor
    const runRes = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directUrls: REEL_URLS,
        resultsType: 'posts',
        resultsLimit: 3,
        addParentData: false
      })
    });
    
    const run = await runRes.json();
    const runId = run.data?.id;
    
    if (!runId) {
      console.error('Failed to start Apify run:', run);
      return;
    }
    
    // Wait for run to finish
    let status = run.data.status;
    while (status === 'READY' || status === 'RUNNING') {
      await new Promise(r => setTimeout(r, 3000));
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      const statusData = await statusRes.json();
      status = statusData.data.status;
      console.log('Apify run status:', status);
    }
    
    if (status !== 'SUCCEEDED') {
      console.error('Apify run failed:', status);
      return;
    }
    
    // Get results
    const datasetId = run.data.defaultDatasetId;
    const resultsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`);
    const results = await resultsRes.json();
    
    // Fetch profile info separately
    const profileRunRes = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${INSTAGRAM_USERNAME}/`],
        resultsType: 'details',
        resultsLimit: 1
      })
    });
    
    const profileRun = await profileRunRes.json();
    const profileRunId = profileRun.data?.id;
    let followers = null;
    
    if (profileRunId) {
      let pStatus = profileRun.data.status;
      while (pStatus === 'READY' || pStatus === 'RUNNING') {
        await new Promise(r => setTimeout(r, 3000));
        const pStatusRes = await fetch(`https://api.apify.com/v2/actor-runs/${profileRunId}?token=${APIFY_TOKEN}`);
        const pStatusData = await pStatusRes.json();
        pStatus = pStatusData.data.status;
      }
      if (pStatus === 'SUCCEEDED') {
        const pDatasetId = profileRun.data.defaultDatasetId;
        const pResultsRes = await fetch(`https://api.apify.com/v2/datasets/${pDatasetId}/items?token=${APIFY_TOKEN}`);
        const pResults = await pResultsRes.json();
        followers = pResults[0]?.followersCount || pResults[0]?.followers || null;
      }
    }
    
    const reels = results.map(r => ({
      id: r.shortCode || r.url?.match(/\/reel\/([^/]+)/)?.[1],
      likes: r.likesCount || r.likes || 0,
      views: r.videoViewCount || r.videoViews || r.views || 0
    }));
    
    const stats = { followers, reels };
    fs.writeFileSync(
      path.join(process.cwd(), 'data/instagram-stats.json'),
      JSON.stringify(stats, null, 2)
    );
    console.log('Instagram stats fetched via Apify:', stats);
  } catch (e) {
    console.error('Failed to fetch Instagram stats via Apify:', e);
  }
}

fetchStats();
