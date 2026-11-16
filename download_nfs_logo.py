import urllib.request

url = 'https://www.nfs.go.kr/images/nfs/common/logo.png'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = resp.read()
        with open('nfs_official_logo.png', 'wb') as f:
            f.write(data)
        print('DOWNLOAD SUCCESS! Size:', len(data))
except Exception as e:
    print('ERROR:', e)
