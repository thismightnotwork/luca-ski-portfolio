import json
import re
import os

try:
    import cloudscraper
    scraper = cloudscraper.create_scraper()
    resp = scraper.get('https://urlebird.com/user/luca.fb_ski/')
    html = resp.text
    # Look for numbers
    numbers = re.findall(r'([0-9]{1,3}(?:,[0-9]{3})+)', html)
    nums = [int(n.replace(',', '')) for n in numbers if int(n.replace(',', '')) > 100]
    nums = sorted(set(nums), reverse=True)
    
    followers = None
    likes = None
    views = None
    for n in nums:
        if 500 < n < 2000 and followers is None:
            followers = n
        elif 10000 < n < 100000 and likes is None:
            likes = n
        elif 1000000 < n < 3000000 and views is None:
            views = n
    
    # Try direct patterns
    m = re.search(r'([\d,]+)\s*[Ff]ollowers', html)
    if m: followers = int(m.group(1).replace(',', ''))
    m = re.search(r'([\d,]+)\s*[Ll]ikes', html)
    if m: likes = int(m.group(1).replace(',', ''))
    m = re.search(r'([\d,]+)\s*[Vv]iews', html)
    if m: views = int(m.group(1).replace(',', ''))
    
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
            'views': views,
            'followers': followers if followers is not None else existing.get('tiktok', {}).get('followers'),
            'updatedAt': __import__('datetime').datetime.utcnow().isoformat() + 'Z'
        }
    }
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w') as f:
        json.dump(totals, f, indent=2)
    print('TikTok:', totals['tiktok'])
except Exception as e:
    print('err', e)
