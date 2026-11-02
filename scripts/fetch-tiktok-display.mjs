import fs from 'fs';
import path from 'path';

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.TIKTOK_REFRESH_TOKEN;
const OPEN_ID = process.env.TIKTOK_OPEN_ID;

const OUT = path.join(process.cwd(), 'data', 'social-totals.json');

async function refreshToken() {
  if (!REFRESH_TOKEN || !CLIENT_KEY || !CLIENT_SECRET) return null;
  try {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN
      })
    });
    const data = await res.json();
    if (data.access_token) {
      return data.access_token;
    }
  } catch (e) {
    console.error('Failed to refresh TikTok token:', e);
  }
  return null;
}

async function fetchStats() {
  let token = ACCESS_TOKEN;
  if (!token) {
    token = await refreshToken();
  }
  if (!token) {
    console.log('No TikTok token available');
    return null;
  }

  try {
    // Get user info
    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count,video_count', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const userData = await userRes.json();
    
    let followers = userData.data?.user?.follower_count || null;
    let likes = userData.data?.user?.likes_count || 0;
    
    // Get all videos to sum accurately
    let cursor = null;
    let hasMore = true;
    let totalLikes = 0;
    let totalViews = 0;
    let videoCount = 0;
    
    while (hasMore) {
      const url = new URL('https://open.tiktokapis.com/v2/video/list/');
      url.searchParams.set('fields', 'id,like_count,view_count,comment_count');
      if (cursor) url.searchParams.set('cursor', cursor);
      if (OPEN_ID) url.searchParams.set('open_id', OPEN_ID);
      
      const videoRes = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const videoData = await videoRes.json();
      
      if (videoData.data?.videos) {
        for (const v of videoData.data.videos) {
          totalLikes += Number(v.like_count || 0);
          totalViews += Number(v.view_count || 0);
          videoCount++;
        }
      }
      
      cursor = videoData.data?.cursor;
      hasMore = videoData.data?.has_more && cursor;
      if (videoCount > 10000) break; // safety limit
    }
    
    // Use summed values if available, otherwise fallback to profile
    if (videoCount > 0) {
      likes = totalLikes;
    }
    
    return {
      followers,
      likes,
      views: totalViews,
      videoCount
    };
  } catch (e) {
    console.error('Failed to fetch TikTok stats:', e);
    return null;
  }
}

async function main() {
  const stats = await fetchStats();
  if (!stats) {
    console.log('TikTok fetch failed, skipping');
    return;
  }
  
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch (e) {}
  
  const totals = {
    ...existing,
    tiktok: {
      likes: stats.likes,
      views: stats.views,
      followers: stats.followers,
      updatedAt: new Date().toISOString()
    }
  };
  
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(totals, null, 2));
  console.log('TikTok stats updated:', totals.tiktok);
}

main();
