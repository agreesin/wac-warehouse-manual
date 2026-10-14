from PIL import Image, ImageDraw, ImageFont

both = Image.open('C:/Users/agree/.gemini/antigravity/brain/d777caf4-0a95-431c-9885-34f309c20726/scratch/both_stickers.jpg')
bw, bh = both.size

card_w, card_h = 1200, 1020
card = Image.new('RGB', (card_w, card_h), (248, 250, 252))
draw = ImageDraw.Draw(card)

font_title = ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', 30)
font_sub = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 20)
font_bold = ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', 22)
font_large = ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', 28)
font_badge = ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', 16)
font_small = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 17)
font_warn_head = ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', 18)
font_warn_body = ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', 17)

# Header banner (dark slate)
draw.rectangle([0, 0, card_w, 100], fill=(30, 41, 59))
draw.text((36, 18), '[실물 송장] 고객 ID 확인 및 0~9번 랙 분류 기준', font=font_title, fill=(255, 255, 255))
draw.text((36, 60), "택배 송장 주소란의 W01*-**** 확인  (QR 라벨의 뒤 4자리 '5051'로 오분류 절대 금지)", font=font_sub, fill=(226, 232, 240))

target_h = 690
target_w = int(bw * (target_h / bh))
both_resized = both.resize((target_w, target_h), Image.Resampling.LANCZOS)
paste_x = 40
paste_y = 120
card.paste(both_resized, (paste_x, paste_y))
draw.rectangle([paste_x-2, paste_y-2, paste_x+target_w+2, paste_y+target_h+2], outline=(203, 213, 225), width=2)

# Blue box around W010-0161
c_box_top = paste_y + int(target_h * 0.35)
c_box_bottom = paste_y + int(target_h * 0.44)
c_box_left = paste_x + int(target_w * 0.28)
c_box_right = paste_x + int(target_w * 0.88)
draw.rectangle([c_box_left, c_box_top, c_box_right, c_box_bottom], outline=(37, 99, 235), width=4)

# Blue badge above customer ID
draw.rounded_rectangle([c_box_left, c_box_top - 24, c_box_left + 175, c_box_top], radius=4, fill=(37, 99, 235))
draw.text((c_box_left + 8, c_box_top - 22), 'O 분류 기준 (0161)', font=font_badge, fill=(255, 255, 255))

# Red box around QR sticker
qr_box_left = paste_x + 34
qr_box_right = paste_x + 242
qr_box_top = paste_y + 388
qr_box_bottom = paste_y + 538
draw.rectangle([qr_box_left, qr_box_top, qr_box_right, qr_box_bottom], outline=(220, 38, 38), width=3)

# Highlight box specifically around -5051 on the sticker
s5_left = paste_x + 118
s5_right = paste_x + 204
s5_top = paste_y + 452
s5_bottom = paste_y + 492
draw.rectangle([s5_left, s5_top, s5_right, s5_bottom], outline=(220, 38, 38), width=3)

# Red pill above QR sticker
draw.rounded_rectangle([qr_box_left, qr_box_top - 24, qr_box_left + 245, qr_box_top], radius=4, fill=(220, 38, 38))
draw.text((qr_box_left + 8, qr_box_top - 22), 'X 5051 보고 5번 랙 오분류 금지!', font=font_badge, fill=(255, 255, 255))

panel_x = paste_x + target_w + 35
panel_w = card_w - panel_x - 40
panel_y = paste_y

# 1. DO: Customer ID on Label
h1 = 260
draw.rounded_rectangle([panel_x, panel_y, panel_x + panel_w, panel_y + h1], radius=12, fill=(239, 246, 255), outline=(59, 130, 246), width=2)
draw.rounded_rectangle([panel_x + 18, panel_y + 14, panel_x + 155, panel_y + 42], radius=6, fill=(37, 99, 235))
draw.text((panel_x + 26, panel_y + 17), 'O 진짜 분류 기준', font=font_badge, fill=(255, 255, 255))
draw.text((panel_x + 168, panel_y + 16), '송장 주소란 끝 [고객 ID]', font=font_bold, fill=(30, 58, 138))

draw.text((panel_x + 20, panel_y + 54), 'W010 - 0161', font=font_large, fill=(29, 78, 216))
draw.text((panel_x + 20, panel_y + 98), '• 택배 송장 주소 끝에 표기된 W01*-**** 확인', font=font_small, fill=(30, 41, 59))
draw.text((panel_x + 20, panel_y + 126), '• 뒤 4자리(0161) 중 가장 첫 번째 자리: [ 0 ]', font=font_bold, fill=(30, 58, 138))

draw.rounded_rectangle([panel_x + 18, panel_y + 160, panel_x + panel_w - 18, panel_y + 242], radius=8, fill=(240, 253, 244), outline=(34, 197, 94), width=2)
draw.text((panel_x + 30, panel_y + 172), '-> [ 0번 랙 앞 ] 바닥에 가져다 놓기 (정답)', font=font_bold, fill=(21, 128, 61))
draw.text((panel_x + 30, panel_y + 206), '뒤 4자리(0161)의 첫 번째 숫자 [0]을 보고 0번 랙 배치', font=font_small, fill=(22, 101, 52))

# 2. DONT: Cargo ID Sticker (QR) - specifically explaining the 5051 trap
panel_y2 = panel_y + h1 + 16
h2 = 290
draw.rounded_rectangle([panel_x, panel_y2, panel_x + panel_w, panel_y2 + h2], radius=12, fill=(254, 242, 242), outline=(239, 68, 68), width=2)
draw.rounded_rectangle([panel_x + 18, panel_y2 + 14, panel_x + 175, panel_y2 + 42], radius=6, fill=(220, 38, 38))
draw.text((panel_x + 26, panel_y2 + 17), 'X 치명적 오인 주의', font=font_badge, fill=(255, 255, 255))
draw.text((panel_x + 185, panel_y2 + 16), 'QR 라벨 [화물 ID] 뒤 4자리 오인 금지', font=font_bold, fill=(153, 27, 27))

draw.text((panel_x + 20, panel_y2 + 54), 'W1008 - 5051 (화물 ID)', font=font_large, fill=(185, 28, 28))

# Warning inner callout
draw.rounded_rectangle([panel_x + 18, panel_y2 + 96, panel_x + panel_w - 18, panel_y2 + 206], radius=8, fill=(255, 255, 255), outline=(252, 165, 165), width=1)
draw.text((panel_x + 28, panel_y2 + 106), '! 현장에서 가장 많이 하는 오분류 실수:', font=font_warn_head, fill=(185, 28, 28))
draw.text((panel_x + 28, panel_y2 + 134), "QR 라벨 뒤 4자리 [ 5051 ]의 첫 숫자 '5'를 보고", font=font_warn_body, fill=(153, 27, 27))
draw.text((panel_x + 28, panel_y2 + 160), '-> [ 5번 랙 ]으로 잘못 가져다 놓는 사고 발생!! (절대 금지)', font=font_warn_body, fill=(220, 38, 38))

draw.text((panel_x + 20, panel_y2 + 222), '• 1차 분류 시에는 QR 라벨의 5051 번호를 완전히 무시하세요.', font=font_small, fill=(127, 29, 29))
draw.text((panel_x + 20, panel_y2 + 252), '• 화물 ID(5051)는 1차 분류용이 아닌 나중 라벨링/대조용 번호입니다.', font=font_small, fill=(127, 29, 29))

# Bottom notice for exceptions
banner_y = paste_y + target_h + 16
banner_h = card_h - banner_y - 16
draw.rounded_rectangle([40, banner_y, card_w - 40, banner_y + banner_h], radius=10, fill=(241, 245, 249), outline=(203, 213, 225), width=1)
draw.rounded_rectangle([55, banner_y + 12, 175, banner_y + 40], radius=6, fill=(100, 116, 139))
draw.text((65, banner_y + 15), '예외 화물 보관', font=font_badge, fill=(255, 255, 255))
draw.text((190, banner_y + 14), 'WB시작 · HG시작 · 고객 ID 번호 없는 화물 -> [래핑테이프 상자 앞쪽]에 모아두기', font=font_bold, fill=(51, 65, 85))
draw.text((55, banner_y + 46), '해당 예외 화물들은 0~9번 랙에 두지 않고, 래핑테이프 상자 앞쪽에 따로 모아둡니다.', font=font_sub, fill=(100, 116, 139))

card.save('public/express/06-customer-id-guide.jpg', quality=95)
print('Saved public/express/06-customer-id-guide.jpg')
