import fs from 'fs';
import path from 'path';

const API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyDv5D31d74wrAr82MnRj81-RNwlMsJOHXc';
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const OUT = path.join(process.cwd(), 'data', 'social-totals.json');

async function fetchStats() {
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
        subscribers: Number(stats.subscriberCount || 0),
        views: Number(stats.viewCount || 0),
        videos: Number(stats.videoCount || 0)
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
