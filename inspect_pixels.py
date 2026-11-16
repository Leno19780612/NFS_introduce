from PIL import Image

im = Image.open('nfs_official_logo.png')
print('Format:', im.format, 'Size:', im.size, 'Mode:', im.mode)

# 좌측 태극 문양 영역 픽셀 조사 (태극 문양은 대략 x: 0~75, y: 0~74)
sample_colors = {}
for y in range(im.size[1]):
    for x in range(im.size[0]):
        c = im.getpixel((x, y))
        if c[3] > 30: # 투명이 아닌 픽셀
            # rgb 범주
            key = (c[0], c[1], c[2])
            sample_colors[key] = sample_colors.get(key, 0) + 1

# 많이 나오는 컬러 순위
sorted_c = sorted(sample_colors.items(), key=lambda x: x[1], reverse=True)
for col, cnt in sorted_c[:15]:
    print('RGB:', col, 'Count:', cnt)
