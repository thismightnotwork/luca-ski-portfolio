import json
import re
import os
from datetime import datetime

try:
    import cloudscraper
    scraper = cloudscraper.create_scraper()
    resp = scraper.get('https://tiktokstalk.com/user/luca.fb_ski', headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })
    html = resp.text
    
    followers = None
    likes = None
    views = None
    
    m = re.search(r'Followers[^\d]*([\d,]+)', html, re.I)
    if m: followers = int(m.group(1).replace(',', ''))
    m = re.search(r'Likes[^\d]*([\d,]+)', html, re.I)
    if m: likes = int(m.group(1).replace(',', ''))
    m = re.search(r'Views[^\d]*([\d,]+)', html, re.I)
    if m: views = int(m.group(1).replace(',', ''))
    
    if followers is None or likes is None or views is None:
        # try direct
        resp2 = scraper.get('https://www.tiktok.com/@luca.fb_ski')
        html2 = resp2.text
        if followers is None:
            m = re.search(r'"followerCount"\s*:\s*(\d+)', html2)
            if m: followers = int(m.group(1))
        if likes is None:
            m = re.search(r'"heartCount"\s*:\s*(\d+)', html2)
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
