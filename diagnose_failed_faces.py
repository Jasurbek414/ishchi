import psycopg2
import cv2
import os

try:
    conn = psycopg2.connect("dbname=maktabdb user=postgres host=127.0.0.1 port=5434")
    cur = conn.cursor()
    cur.execute("SELECT id, full_name, face_id, photo_url, sync_error FROM students WHERE sync_status = 'FAILED'")
    rows = cur.fetchall()
    print(f"Total failed students in DB: {len(rows)}")

    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    upload_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/_data'

    no_face = 0
    multi_face = 0
    small_face = 0
    ok_face = 0
    missing_file = 0

    for s_id, name, face_id, photo_url, err in rows:
        fname = os.path.basename(photo_url) if photo_url else ''
        fpath = os.path.join(upload_dir, fname)
        if not os.path.isfile(fpath):
            missing_file += 1
            print(f"Missing file: {fpath} for {name}")
            continue
        img = cv2.imread(fpath)
        if img is None:
            print(f"Cannot read image: {fpath}")
            continue
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4, minSize=(25, 25))
        if len(faces) == 0:
            no_face += 1
        elif len(faces) > 1:
            multi_face += 1
        else:
            fx, fy, fw, fh = faces[0]
            ratio = fh / h
            if ratio < 0.35 or ratio > 0.85:
                small_face += 1
            else:
                ok_face += 1

    print(f"\n--- Diagnostic Summary ---")
    print(f"Total: {len(rows)}")
    print(f"Missing file: {missing_file}")
    print(f"No face detected by Haar cascade: {no_face}")
    print(f"Multiple faces detected: {multi_face}")
    print(f"Face ratio bad (<0.35 or >0.85): {small_face}")
    print(f"Ok face framing: {ok_face}")

    # Print first 5 failed students detail
    for s_id, name, face_id, photo_url, err in rows[:5]:
        fname = os.path.basename(photo_url) if photo_url else ''
        fpath = os.path.join(upload_dir, fname)
        img = cv2.imread(fpath)
        h, w = img.shape[:2] if img is not None else (0, 0)
        print(f"Student #{s_id} '{name}': size={w}x{h}, file={fname}")

except Exception as e:
    print("Error:", e)
