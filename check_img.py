from PIL import Image

im = Image.open('nfs_official_logo.png')
print('Dimensions:', im.size, 'Mode:', im.mode)
