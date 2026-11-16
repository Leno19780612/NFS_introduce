from PIL import Image

im = Image.open('nfs_official_logo.png')
# 상단/헤더에 로고가 흰 배경이나 어두운 배경 어디든 잘 보일 수 있도록 처리
# nfs_official_logo.png의 색상 구성 확인
colors = im.getcolors(maxcolors=2000)
print('Total unique colors:', len(colors))
# 주요 픽셀 RGB 출력
non_transparent = [c for c in colors if len(c[1]) == 4 and c[1][3] > 100]
non_transparent.sort(key=lambda x: x[0], reverse=True)
for count, col in non_transparent[:5]:
    print('Color:', col, 'Count:', count)
