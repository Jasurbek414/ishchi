import cv2
import os
import glob

with open('/opt/maktab_davomad/failed.csv', 'r', encoding='utf-8') as f:
    failed_files = [line.strip().split('|')[3].split('/')[-1] for line in f if '|' in line]

upload_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/_data'

print('Failed files count in CSV:', len(failed_files))
failed_sizes = {}
for fn in failed_files:
    fp = os.path.join(upload_dir, fn)
    if os.path.exists(fp):
        img = cv2.imread(fp)
        if img is not None:
            s = f"{img.shape[1]}x{img.shape[0]}"
            failed_sizes[s] = failed_sizes.get(s, 0) + 1

print('Failed photos resolutions:')
for s, c in sorted(failed_sizes.items(), key=lambda x: -x[1]):
    print(f"  {s}: {c} ta")
