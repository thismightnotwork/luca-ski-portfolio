import fs from 'fs';
import path from 'path';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const INSTAGRAM_USERNAME = 'luca.fb_ski';

async function fetchStats() {
  if (!APIFY_TOKEN) {
    console.log('No APIFY_TOKEN found, skipping Apify fetch');
    return;
  }

  try {
    // Fetch ALL posts from profile
    const profileRunRes = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${INSTAGRAM_USERNAME}/`],
        resultsType: 'posts',
        resultsLimit: 100,
        addParentData: false
      })
    });
    
    const profileRun = await profileRunRes.json();
    const profileRunId = profileRun.data?.id;
    
    if (!profileRunId) {
      console.error('Failed to start Apify run:', profileRun);
      return;
    }
    
    let pStatus = profileRun.data.status;
    while (pStatus === 'READY' || pStatus === 'RUNNING') {
      await new Promise(r => setTimeout(r, 5000));
      const pStatusRes = await fetch(`https://api.apify.com/v2/actor-runs/${profileRunId}?token=${APIFY_TOKEN}`);
      const pStatusData = await pStatusRes.json();
      pStatus = pStatusData.data.status;
      console.log('Apify profile run status:', pStatus);
    }
    
    if (pStatus !== 'SUCCEEDED') {
      console.error('Apify run failed:', pStatus);
      return;
    }
    
    const pDatasetId = profileRun.data.defaultDatasetId;
    const pResultsRes = await fetch(`https://api.apify.com/v2/datasets/${pDatasetId}/items?token=${APIFY_TOKEN}`);
    const results = await pResultsRes.json();
    
    // Also fetch profile details for follower count
    const detailsRunRes = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${INSTAGRAM_USERNAME}/`],
        resultsType: 'details',
        resultsLimit: 1
      })
    });
    
    const detailsRun = await detailsRunRes.json();
    const detailsRunId = detailsRun.data?.id;
    let followers = null;
    
    if (detailsRunId) {
      let dStatus = detailsRun.data.status;
      while (dStatus === 'READY' || dStatus === 'RUNNING') {
        await new Promise(r => setTimeout(r, 3000));
        const dStatusRes = await fetch(`https://api.apify.com/v2/actor-runs/${detailsRunId}?token=${APIFY_TOKEN}`);
        const dStatusData = await dStatusRes.json();
        dStatus = dStatusData.data.status;
      }
      if (dStatus === 'SUCCEEDED') {
        const dDatasetId = detailsRun.data.defaultDatasetId;
        const dResultsRes = await fetch(`https://api.apify.com/v2/datasets/${dDatasetId}/items?token=${APIFY_TOKEN}`);
        const dResults = await dResultsRes.json();
        followers = dResults[0]?.followersCount || dResults[0]?.followers || null;
      }
    }
    
    const reels = results.map(r => ({
      id: r.shortCode || r.url?.match(/\/(reel|p)\/([^/]+)/)?.[2],
      url: r.url,
      likes: r.likesCount || r.likes || 0,
      views: r.videoViewCount || r.videoViews || r.views || 0,
      type: r.type
    })).filter(r => r.id);
    
    const totalLikes = reels.reduce((sum, r) => sum + (r.likes || 0), 0);
    const totalViews = reels.reduce((sum, r) => sum + (r.views || 0), 0);
    
    const stats = { 
      followers, 
      reels,
      totalLikes,
      totalViews,
      totalPosts: reels.length
    };
    
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
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
