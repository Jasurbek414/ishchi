import os
import sys
import uuid
import tarfile
import json
import requests
from requests.auth import HTTPDigestAuth
import urllib3
urllib3.disable_warnings()

DEVICE_IP = '192.168.88.253'
DEVICE_USER = 'admin'
DEVICE_PASS = '02051974m@'
BASE_URL = f'https://{DEVICE_IP}'

auth = HTTPDigestAuth(DEVICE_USER, DEVICE_PASS)

print("1. Fetching all users from terminal...")
all_users = []
pos = 0
while True:
    payload = {
        'UserInfoSearchCond': {
            'searchID': str(uuid.uuid4())[:8],
            'searchResultPosition': pos,
            'maxResults': 30
        }
    }
    r = requests.post(f'{BASE_URL}/ISAPI/AccessControl/UserInfo/Search?format=json', json=payload, auth=auth, verify=False, timeout=10)
    if r.status_code != 200 or not r.text:
        break
    data = r.json()
    batch = data.get('UserInfoSearch', {}).get('UserInfo', [])
    if not batch:
        break
    all_users.extend(batch)
    pos += len(batch)
    if data.get('UserInfoSearch', {}).get('responseStatusStrg') != 'MORE':
        break

print(f"Total users found: {len(all_users)}")

print("2. Fetching all face URLs from FDLib...")
face_map = {} # employeeNo (FPID) -> faceURL
pos = 0
total_matches = None

while True:
    payload = {
        'searchResultPosition': pos,
        'maxResults': 30,
        'faceLibType': 'blackFD',
        'FDID': '1'
    }
    r = requests.post(f'{BASE_URL}/ISAPI/Intelligent/FDLib/FDSearch?format=json', json=payload, auth=auth, verify=False, timeout=10)
    if r.status_code != 200 or not r.text.strip():
        break
    try:
        data = r.json()
    except Exception:
        break
        
    matches = data.get('MatchList', [])
    if not matches:
        break
    if total_matches is None:
        total_matches = data.get('totalMatches', 0)
        
    for m in matches:
        fpid = m.get('FPID')
        furl = m.get('faceURL')
        if fpid and furl:
            face_map[fpid] = furl
            
    pos += len(matches)
    if len(face_map) >= total_matches or data.get('responseStatusStrg') != 'MORE':
        break

print(f"Total faces found in FDLib: {len(face_map)}")

os.makedirs('temp_photos', exist_ok=True)
records = []

for u in all_users:
    emp_no = str(u.get('employeeNo', '')).strip()
    name = str(u.get('name', '')).strip()
    if not emp_no:
        continue
    
    photo_rel_path = None
    if emp_no in face_map:
        furl = face_map[emp_no]
        clean_url = furl.split('@')[0]
        try:
            resp = requests.get(clean_url, auth=auth, verify=False, timeout=10)
            if resp.status_code == 200 and resp.content:
                hex_name = uuid.uuid4().hex + '.jpg'
                local_path = os.path.join('temp_photos', hex_name)
                with open(local_path, 'wb') as f:
                    f.write(resp.content)
                photo_rel_path = f'photos/{hex_name}'
                print(f"Downloaded face for {emp_no} ({name}): {hex_name} ({len(resp.content)} bytes)")
            else:
                print(f"Failed to download face for {emp_no}: HTTP {resp.status_code}")
        except Exception as e:
            print(f"Error downloading face for {emp_no}: {e}")
    else:
        print(f"No face in FDLib for {emp_no} ({name})")

    records.append({
        'employee_code': emp_no,
        'full_name': name,
        'photo_path': photo_rel_path
    })

print(f"\nPrepared {len(records)} employee records.")

with open('employees_to_import.json', 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

with tarfile.open('photos.tar.gz', 'w:gz') as tar:
    for f in os.listdir('temp_photos'):
        p = os.path.join('temp_photos', f)
        tar.add(p, arcname=f)

print(f"Created photos.tar.gz successfully with {len(os.listdir('temp_photos'))} photos!")
