import os
import cv2
import csv
import json
import urllib.request
import ssl
from requests.auth import HTTPDigestAuth
import requests

upload_dir = '/var/lib/docker/volumes/maktab_davomad_uploads/_data'
failed_csv = '/opt/maktab_davomad/failed.csv'

with open(failed_csv, 'r', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter='|')
    rows = list(reader)

print(f"Total failed students in CSV: {len(rows)}")

cascade_path = '/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(cascade_path)

stats = {
    'total': len(rows),
    'missing': 0,
    'no_face': 0,
    'multi_face': 0,
    'small_face': 0,
    'ok_face': 0
}

dimensions = []

for row in rows:
    s_id, name, face_id, photo_url, err = row
    fname = os.path.basename(photo_url) if photo_url else ''
    fpath = os.path.join(upload_dir, fname)
    if not os.path.isfile(fpath):
        stats['missing'] += 1
        continue
    img = cv2.imread(fpath)
    if img is None:
        stats['missing'] += 1
        continue
    h, w = img.shape[:2]
    dimensions.append((w, h))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(20, 20))
    if len(faces) == 0:
        stats['no_face'] += 1
    elif len(faces) > 1:
        stats['multi_face'] += 1
    else:
        fx, fy, fw, fh = faces[0]
        ratio = fh / h
        if ratio < 0.35 or ratio > 0.85:
            stats['small_face'] += 1
        else:
            stats['ok_face'] += 1

print("\n--- Diagnostic Stats ---")
print(json.dumps(stats, indent=2))

if dimensions:
    print(f"Sample dimensions: {dimensions[:10]}")

# Now test ISAPI upload for 1 student with requests (Digest auth)
print("\n--- Testing ISAPI Direct Upload ---")
sample = rows[0]
s_id, name, face_id, photo_url, err = sample
fname = os.path.basename(photo_url)
fpath = os.path.join(upload_dir, fname)

employee_no = face_id.replace('-', '')
print(f"Testing student #{s_id}: '{name}', face_id='{face_id}', employeeNo='{employee_no}', file='{fname}'")

# Step 1: upsert user
target_url = "https://10.30.2.251:443"
user_payload = {
    "UserInfo": {
        "employeeNo": employee_no,
        "name": name[:32],
        "userType": "normal",
        "Valid": {
            "enable": True,
            "beginTime": "2024-01-01T00:00:00",
            "endTime": "2037-12-31T23:59:59",
            "timeType": "local"
        },
        "doorRight": "1",
        "RightPlan": [{"doorNo": 1, "planTemplateNo": "1"}]
    }
}

try:
    res = requests.put(
        f"{target_url}/ISAPI/AccessControl/UserInfo/SetUp?format=json",
        auth=HTTPDigestAuth('admin', 'Password2025'),
        json=user_payload,
        verify=False,
        timeout=10
    )
    print("UserInfo/SetUp status:", res.status_code, res.text)
except Exception as e:
    print("UserInfo/SetUp error:", e)

# Step 2: Set face
face_record = {
    "faceLibType": "blackFD",
    "FDID": "1",
    "FPID": employee_no
}

with open(fpath, 'rb') as img_f:
    img_bytes = img_f.read()

print(f"Image file size: {len(img_bytes)} bytes")

try:
    files = {
        'FaceDataRecord': (None, json.dumps(face_record), 'application/json'),
        'img': (fname, img_bytes, 'image/jpeg')
    }
    res = requests.put(
        f"{target_url}/ISAPI/Intelligent/FDLib/FDSetUp?format=json",
        auth=HTTPDigestAuth('admin', 'Password2025'),
        files=files,
        verify=False,
        timeout=10
    )
    print("FDSetUp status:", res.status_code, res.text)
except Exception as e:
    print("FDSetUp error:", e)
