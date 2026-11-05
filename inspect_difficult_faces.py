import cv2
import os

upload_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/_data'
backup_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/backup_originals'

f617 = os.path.join(backup_dir, '0d9655986ef1459293be7daa83e502f4.jpg')
f621 = os.path.join(backup_dir, 'c48904d3e51d4255833688521a26c89b.jpg')

for path, sid in [(f617, 617), (f621, 621)]:
    img = cv2.imread(path)
    if img is None:
        print(f"{sid}: img is None")
        continue
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Try different scaleFactors and minNeighbors
    for sf in [1.03, 1.05, 1.08]:
        for mn in [1, 2, 3]:
            for casc_file in [
                'haarcascade_frontalface_default.xml',
                'haarcascade_frontalface_alt.xml',
                'haarcascade_frontalface_alt2.xml',
                'haarcascade_frontalface_alt_tree.xml'
            ]:
                cp = os.path.join('/usr/share/opencv4/haarcascades', casc_file)
                if not os.path.exists(cp):
                    continue
                c = cv2.CascadeClassifier(cp)
                f = c.detectMultiScale(gray, sf, mn)
                if len(f) > 0:
                    print(f"{sid} ({casc_file}, sf={sf}, mn={mn}): detected {len(f)} faces -> {f[0]}")
                    break
            else:
                continue
            break
        else:
            continue
        break
