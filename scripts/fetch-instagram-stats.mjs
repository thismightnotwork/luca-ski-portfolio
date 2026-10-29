import fs from 'fs';
import path from 'path';

const IG_USER_ID = process.env.IG_USER_ID;
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
const REEL_IDS = [
  'De-ZZVboXQR',
  'DemibnZIrBN', 
  'DeY6onVo76f'
];

async function fetchStats() {
  if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
    console.log('No Instagram credentials found, skipping live stats fetch');
    return;
  }

  try {
    // Fetch profile info
    const profileRes = await fetch(
      `https://graph.instagram.com/${IG_USER_ID}?fields=followers_count,media_count&access_token=${IG_ACCESS_TOKEN}`
    );
    const profile = await profileRes.json();
    
    // Fetch media insights for each reel
    const reels = [];
    for (const reelId of REEL_IDS) {
      try {
        const mediaRes = await fetch(
          `https://graph.instagram.com/${IG_USER_ID}/media?fields=id,caption,media_type,like_count,comments_count,permalink,timestamp,media_url,thumbnail_url,video_views&access_token=${IG_ACCESS_TOKEN}`
        );
        const media = await mediaRes.json();
        const reel = media.data?.find(m => m.permalink?.includes(reelId));
        if (reel) {
          reels.push({
            id: reelId,
            likes: reel.like_count || 0,
            views: reel.video_views || reel.like_count || 0
          });
        }
      } catch (e) {
        console.error(`Failed to fetch reel ${reelId}:`, e.message);
      }
    }

    const stats = {
      followers: profile.followers_count || null,
      reels
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'data/instagram-stats.json'),
      JSON.stringify(stats, null, 2)
    );
    console.log('Instagram stats fetched:', stats);
  } catch (e) {
    console.error('Failed to fetch Instagram stats:', e);
  }
}

fetchStats();
