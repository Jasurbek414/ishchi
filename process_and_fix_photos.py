import cv2
import os
import shutil
import glob
import numpy as np

upload_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/_data'
backup_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/backup_originals'
os.makedirs(backup_dir, exist_ok=True)

with open('/opt/maktab_davomad/failed.csv', 'r', encoding='utf-8') as f:
    failed_rows = [line.strip().split('|') for line in f if '|' in line]

print(f"Total failed students to process: {len(failed_rows)}")

cascade_path = '/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml'
cascade_alt_path = '/usr/share/opencv4/haarcascades/haarcascade_frontalface_alt2.xml'
profile_path = '/usr/share/opencv4/haarcascades/haarcascade_profileface.xml'

face_cascade = cv2.CascadeClassifier(cascade_path)
face_cascade_alt = cv2.CascadeClassifier(cascade_alt_path) if os.path.exists(cascade_alt_path) else None
profile_cascade = cv2.CascadeClassifier(profile_path) if os.path.exists(profile_path) else None

def detect_best_face(img):
    H, W = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 1. Standard frontal
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(20, 20))
    if len(faces) > 0:
        return max(faces, key=lambda f: f[2] * f[3])
        
    # 2. Equalized histogram
    eq = cv2.equalizeHist(gray)
    faces = face_cascade.detectMultiScale(eq, scaleFactor=1.05, minNeighbors=3, minSize=(20, 20))
    if len(faces) > 0:
        return max(faces, key=lambda f: f[2] * f[3])
        
    # 3. Alt cascade
    if face_cascade_alt:
        faces = face_cascade_alt.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(20, 20))
        if len(faces) > 0:
            return max(faces, key=lambda f: f[2] * f[3])
            
    # 4. Profile cascade
    if profile_cascade:
        faces = profile_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(20, 20))
        if len(faces) > 0:
            return max(faces, key=lambda f: f[2] * f[3])
            
    return None

def enhance_and_sharpen(img):
    # Mild unsharp mask
    blurred = cv2.GaussianBlur(img, (0, 0), 1.2)
    sharpened = cv2.addWeighted(img, 1.25, blurred, -0.25, 0)
    return sharpened

TARGET_W = 480
TARGET_H = 600

processed = 0
fallback_centered = 0

for row in failed_rows:
    s_id, name, face_id, photo_url, err = row
    fname = os.path.basename(photo_url) if photo_url else ''
    fpath = os.path.join(upload_dir, fname)
    if not os.path.isfile(fpath):
        print(f"File not found: {fpath}")
        continue
        
    # Backup original if not yet backed up
    bpath = os.path.join(backup_dir, fname)
    if not os.path.exists(bpath):
        shutil.copy2(fpath, bpath)
        
    img = cv2.imread(bpath)
    if img is None:
        continue
        
    H, W = img.shape[:2]
    best_face = detect_best_face(img)
    
    if best_face is not None:
        fx, fy, fw, fh = best_face
        # Face should occupy ~52% of total height (fh / target_h ≈ 0.52 -> target_h = fh / 0.52 = fh * 1.92)
        target_h = int(fh * 1.95)
        target_w = int(target_h * 0.8) # 4:5 aspect ratio
        
        # Center horizontally on face center
        cx = fx + fw // 2
        # Eye level at ~42% from top
        cy = fy + int(fh * 0.45)
        
        x1 = cx - target_w // 2
        x2 = x1 + target_w
        y1 = cy - int(target_h * 0.42)
        y2 = y1 + target_h
        
        pad_top = max(0, -y1)
        pad_bottom = max(0, y2 - H)
        pad_left = max(0, -x1)
        pad_right = max(0, x2 - W)
        
        if pad_top or pad_bottom or pad_left or pad_right:
            img_padded = cv2.copyMakeBorder(img, pad_top, pad_bottom, pad_left, pad_right, cv2.BORDER_REPLICATE)
            crop = img_padded[y1 + pad_top : y2 + pad_top, x1 + pad_left : x2 + pad_left]
        else:
            crop = img[y1:y2, x1:x2]
            
        resized = cv2.resize(crop, (TARGET_W, TARGET_H), interpolation=cv2.INTER_LANCZOS4)
        final_img = enhance_and_sharpen(resized)
    else:
        # Fallback: image already likely a portrait crop, center-pad to 4:5 and scale up
        fallback_centered += 1
        curr_ratio = W / H
        if curr_ratio > 0.8: # too wide, pad top/bottom
            new_H = int(W / 0.8)
            pad_y = (new_H - H) // 2
            padded = cv2.copyMakeBorder(img, pad_y, new_H - H - pad_y, 0, 0, cv2.BORDER_REPLICATE)
            resized = cv2.resize(padded, (TARGET_W, TARGET_H), interpolation=cv2.INTER_LANCZOS4)
        else: # too tall, pad left/right
            new_W = int(H * 0.8)
            pad_x = (new_W - W) // 2
            padded = cv2.copyMakeBorder(img, 0, 0, pad_x, new_W - W - pad_x, cv2.BORDER_REPLICATE)
            resized = cv2.resize(padded, (TARGET_W, TARGET_H), interpolation=cv2.INTER_LANCZOS4)
        final_img = enhance_and_sharpen(resized)
        
    cv2.imwrite(fpath, final_img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    processed += 1

print(f"\nSuccessfully processed: {processed}/{len(failed_rows)} photos")
print(f"Face detected and framed: {processed - fallback_centered}")
print(f"Fallback center-framed: {fallback_centered}")
print(f"All processed photos are now standardized to {TARGET_W}x{TARGET_H} portrait JPEG!")
