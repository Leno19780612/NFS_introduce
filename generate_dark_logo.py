from PIL import Image

im = Image.open('nfs_official_logo.png')
# 다크모드용 로고 생성:
# 텍스트는 밝은 흰색(#FFFFFF)으로 변경
# 태극 문양의 원래 고유 색상(적색, 청색 등)은 그대로 유지!
dark_im = Image.new('RGBA', im.size, (0, 0, 0, 0))

for y in range(im.size[1]):
    for x in range(im.size[0]):
        r, g, b, a = im.getpixel((x, y))
        if a == 0:
            dark_im.putpixel((x, y), (0, 0, 0, 0))
            continue
        
        # 글자 영역 (회색 텍스트: r ~ g ~ b 계열, 예: 87, 86, 86)
        # 태극 문양 영역인지 글자 영역인지 판단
        # 태극 문양은 주로 x < 75 에 위치하며, 강한 붉은색(r > 180, g < 100) 또는 푸른색(b > 80, r < 100)
        # 글자는 '행정안전부' 및 '국립과학수사연구원' (x >= 70, 회색 R,G,B가 거의 같음)
        is_gray_text = (abs(r - g) < 15 and abs(g - b) < 15 and max(r, g, b) < 160)
        
        if is_gray_text and x >= 70:
            # 텍스트를 흰색(#F8FAFC)으로 변경, 알파값 유지
            dark_im.putpixel((x, y), (248, 250, 252, a))
        else:
            # 태극 문양(적색, 청색, 그라디언트)은 원래의 선명한 색상을 그대로 보존!
            dark_im.putpixel((x, y), (r, g, b, a))

dark_im.save('nfs_official_logo_dark.png')
print('Created nfs_official_logo_dark.png successfully!')
