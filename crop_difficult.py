import cv2
import os

upload_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/_data'
backup_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/backup_originals'

TARGET_W = 480
TARGET_H = 600

# Fix 617
p617 = os.path.join(backup_dir, '0d9655986ef1459293be7daa83e502f4.jpg')
img617 = cv2.imread(p617)
# Face is at x=230, y=110, face width approx 80, height approx 100
cx617 = 230
cy617 = 110
# Target box:
box_h = 240
box_w = int(box_h * 0.8) # 192
x1 = max(0, cx617 - box_w // 2)
x2 = x1 + box_w
y1 = max(0, cy617 - int(box_h * 0.35))
y2 = y1 + box_h
crop617 = img617[y1:y2, x1:x2]
res617 = cv2.resize(crop617, (TARGET_W, TARGET_H), interpolation=cv2.INTER_LANCZOS4)
cv2.imwrite(os.path.join(upload_dir, '0d9655986ef1459293be7daa83e502f4.jpg'), res617, [cv2.IMWRITE_JPEG_QUALITY, 95])
print("Fixed 617 crop!")

# Fix 621
p621 = os.path.join(backup_dir, 'c48904d3e51d4255833688521a26c89b.jpg')
img621 = cv2.imread(p621)
# Eyes at x=210, y=100. Face center approx x=215, y=120
cx621 = 215
cy621 = 120
box_h = 220
box_w = int(box_h * 0.8) # 176
x1 = max(0, cx621 - box_w // 2)
x2 = x1 + box_w
y1 = max(0, cy621 - int(box_h * 0.35))
y2 = y1 + box_h
crop621 = img621[y1:y2, x1:x2]
res621 = cv2.resize(crop621, (TARGET_W, TARGET_H), interpolation=cv2.INTER_LANCZOS4)
cv2.imwrite(os.path.join(upload_dir, 'c48904d3e51d4255833688521a26c89b.jpg'), res621, [cv2.IMWRITE_JPEG_QUALITY, 95])
print("Fixed 621 crop!")
