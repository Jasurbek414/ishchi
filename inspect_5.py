import cv2
import os

upload_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/_data'
backup_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/backup_originals'

files = [
    ('656', 'Xasanboyeva Roziyaxon', '4fb9f5a6831d425b81ef5f756f0a395e.jpg'),
    ('617', 'IKROMJONOVA FERUZA', '0d9655986ef1459293be7daa83e502f4.jpg'),
    ('621', 'MIRZABAXRAMOV BILOL', 'c48904d3e51d4255833688521a26c89b.jpg'),
    ('474', 'TAJITDINOVA MUATTARXON', '610295e6d4d34b9392ff027d90db9e03.jpg'),
    ('610', 'BAXTIYOROVA LOLA', '5f4a7ae2e535465497fc11ea74e2d0c6.jpg')
]

cascade_path = '/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(cascade_path)

for s_id, name, fn in files:
    fp = os.path.join(upload_dir, fn)
    bp = os.path.join(backup_dir, fn)
    img = cv2.imread(fp)
    bimg = cv2.imread(bp) if os.path.exists(bp) else None
    
    h, w = img.shape[:2] if img is not None else (0, 0)
    bh, bw = bimg.shape[:2] if bimg is not None else (0, 0)
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img is not None else None
    faces = face_cascade.detectMultiScale(gray, 1.05, 3) if gray is not None else []
    
    print(f"#{s_id} {name}: current={w}x{h}, backup={bw}x{bh}, faces_detected={len(faces)}")
