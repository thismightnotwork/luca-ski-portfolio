import json
import re
import os
from datetime import datetime

try:
    import cloudscraper
    scraper = cloudscraper.create_scraper()
    resp = scraper.get('https://www.tiktok.com/@luca.fb_ski', headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })
    html = resp.text
    
    followers = None
    likes = None
    views = None
    
    # Try to get from user stats
    m = re.search(r'"followerCount"\s*:\s*(\d+)', html)
    if m: followers = int(m.group(1))
    m = re.search(r'"heartCount"\s*:\s*(\d+)', html)
    if m: likes = int(m.group(1))
    
    # Sum all play counts from any video data
    all_plays = re.findall(r'"playCount"\s*:\s*(\d+)', html)
    if all_plays:
        views = sum(int(x) for x in all_plays)
    
    out_path = os.path.join(os.getcwd(), 'data', 'social-totals.json')
    existing = {}
    try:
        with open(out_path) as f:
            existing = json.load(f)
    except:
        pass
    
    totals = {
        **existing,
        'tiktok': {
            'likes': likes if likes is not None else existing.get('tiktok', {}).get('likes'),
            'views': views if views is not None else existing.get('tiktok', {}).get('views'),
            'followers': followers if followers is not None else existing.get('tiktok', {}).get('followers'),
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        }
    }
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w') as f:
        json.dump(totals, f, indent=2)
    print('TikTok:', totals['tiktok'])
except Exception as e:
    print('err', e)
