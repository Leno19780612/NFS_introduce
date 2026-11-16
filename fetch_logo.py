import urllib.request
import re

req = urllib.request.Request('https://www.nfs.go.kr', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        content = resp.read().decode('utf-8', 'ignore')
        matches = re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"][^>]*>', content, re.IGNORECASE)
        for m in matches:
            if 'logo' in m.lower() or 'ci' in m.lower():
                print('MATCH:', m)
except Exception as e:
    print('ERROR:', e)
