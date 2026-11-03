import fs from 'fs';
import path from 'path';

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const OUT = path.join(process.cwd(), 'data', 'social-totals.json');

async function fetchStats() {
  if (!API_KEY) {
    console.log('YouTube stats: YOUTUBE_API_KEY not set, skipping (scripts skip cleanly, see package.json)');
    return null;
  }
  try {
    let channelId = CHANNEL_ID;
    
    // Try to resolve by handle if no channel ID
    if (!channelId) {
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=luca.fb_ski&key=${API_KEY}`);
      const searchData = await searchRes.json();
      if (searchData.items?.[0]?.snippet?.channelId) {
        channelId = searchData.items[0].snippet.channelId;
      } else {
        // Try channels list by forUsername
        const userRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forUsername=luca.fb_ski&key=${API_KEY}`);
        const userData = await userRes.json();
        if (userData.items?.[0]?.id) {
          channelId = userData.items[0].id;
        }
      }
    }
    
    if (!channelId) {
      console.log('Could not find YouTube channel ID');
      return null;
    }
    
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${API_KEY}`);
    const data = await res.json();
    
    if (data.items?.[0]) {
      const stats = data.items[0].statistics;
      return {
        subscribers: stats.subscriberCount !== undefined ? Number(stats.subscriberCount) : null,
        views: stats.viewCount !== undefined ? Number(stats.viewCount) : null,
        videos: stats.videoCount !== undefined ? Number(stats.videoCount) : null
      };
    }
  } catch (e) {
    console.error('Failed to fetch YouTube stats:', e);
  }
  return null;
}

async function main() {
  const stats = await fetchStats();
  if (!stats) {
    console.log('YouTube fetch failed, skipping');
    return;
  }
  
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch (e) {}
  
  const totals = {
    ...existing,
    youtube: {
      subscribers: stats.subscribers,
      views: stats.views,
      videos: stats.videos,
      updatedAt: new Date().toISOString()
    }
  };
  
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(totals, null, 2));
  console.log('YouTube stats updated:', totals.youtube);
}

main();
