import cv2
import os

with open('/tmp/synced.csv', 'w') as out:
    pass

os.system("docker exec maktab-db psql -U postgres -d maktabdb -c \"COPY (SELECT photo_url FROM students WHERE sync_status = 'SYNCED') TO '/tmp/synced.csv';\"")
os.system("docker cp maktab-db:/tmp/synced.csv /opt/maktab_davomad/synced.csv")

with open('/opt/maktab_davomad/synced.csv', 'r', encoding='utf-8') as f:
    synced_files = [line.strip().split('/')[-1] for line in f if line.strip()]

upload_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/_data'

print('Synced files count:', len(synced_files))
synced_sizes = {}
for fn in synced_files:
    fp = os.path.join(upload_dir, fn)
    if os.path.exists(fp):
        img = cv2.imread(fp)
        if img is not None:
            s = f"{img.shape[1]}x{img.shape[0]}"
            synced_sizes[s] = synced_sizes.get(s, 0) + 1

print('Synced photos resolutions (top 5):')
for s, c in sorted(synced_sizes.items(), key=lambda x: -x[1])[:5]:
    print(f"  {s}: {c} ta")
