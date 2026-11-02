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
    
    # Look for the data in script tags
    for m in re.finditer(r'<script[^>]+>(.+?)</script>', html, re.DOTALL):
        content = m.group(1)
        if 'followerCount' in content and 'heartCount' in content:
            fm = re.search(r'"followerCount"\s*:\s*(\d+)', content)
            if fm: followers = int(fm.group(1))
            lm = re.search(r'"heartCount"\s*:\s*(\d+)', content)
            if lm: likes = int(lm.group(1))
            elif re.search(r'"heart"\s*:\s*(\d+)', content):
                lm = re.search(r'"heart"\s*:\s*(\d+)', content)
                if lm: likes = int(lm.group(1))
            break
    
    if followers is None:
        m = re.search(r'"followerCount"\s*:\s*(\d+)', html)
        if m: followers = int(m.group(1))
    if likes is None:
        m = re.search(r'"heartCount"\s*:\s*(\d+)', html)
        if m: likes = int(m.group(1))
    
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
            'likes': likes,
            'views': existing.get('tiktok', {}).get('views'),
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
