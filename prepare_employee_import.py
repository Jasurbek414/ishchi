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

def make_session():
    s = requests.Session()
    s.auth = HTTPDigestAuth(DEVICE_USER, DEVICE_PASS)
    s.verify = False
    return s

s = make_session()

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
    r = s.post(f'{BASE_URL}/ISAPI/AccessControl/UserInfo/Search?format=json', json=payload, timeout=10)
    if r.status_code == 401:
        s = make_session()
        r = s.post(f'{BASE_URL}/ISAPI/AccessControl/UserInfo/Search?format=json', json=payload, timeout=10)
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

os.makedirs('temp_photos', exist_ok=True)
for f in os.listdir('temp_photos'):
    try:
        os.remove(os.path.join('temp_photos', f))
    except Exception:
        pass

sql_statements = []
downloaded_count = 0

for u in all_users:
    emp_no = str(u.get('employeeNo', '')).strip()
    name = str(u.get('name', '')).strip()
    faces = u.get('numOfFace', 0)
    if not emp_no:
        continue
    
    photo_rel_path = None
    if faces > 0:
        try:
            try:
                emp_int = int(emp_no)
                face_url = f'{BASE_URL}/LOCALS/pic/enrlFace/0/{emp_int:010d}.jpg'
            except ValueError:
                face_url = f'{BASE_URL}/LOCALS/pic/enrlFace/0/{emp_no}.jpg'
                
            resp = s.get(face_url, timeout=10)
            if resp.status_code == 401:
                s = make_session()
                resp = s.get(face_url, timeout=10)
                
            if resp.status_code == 200 and len(resp.content) > 100:
                hex_name = uuid.uuid4().hex + '.jpg'
                local_path = os.path.join('temp_photos', hex_name)
                with open(local_path, 'wb') as f:
                    f.write(resp.content)
                photo_rel_path = f'photos/{hex_name}'
                downloaded_count += 1
                print(f"Downloaded photo for {emp_no} ({name}) -> {hex_name}")
            else:
                print(f"No photo returned for {emp_no} ({name}): HTTP {resp.status_code}")
        except Exception as e:
            print(f"Error downloading photo for {emp_no}: {e}")
    else:
        print(f"User {emp_no} ({name}) has 0 faces")

    name_escaped = name.replace("'", "''")
    photo_val = f"'{photo_rel_path}'" if photo_rel_path else "NULL"
    
    sql = f"""INSERT INTO employees (company_id, employee_code, full_name, schedule_id, active, photo_path, monthly_rest_days, notify_telegram, created_at)
VALUES (3, '{emp_no}', '{name_escaped}', 4, true, {photo_val}, 4, true, now())
ON CONFLICT (company_id, employee_code) DO UPDATE
SET full_name = EXCLUDED.full_name,
    photo_path = COALESCE(EXCLUDED.photo_path, employees.photo_path),
    active = true;"""
    sql_statements.append(sql)

print(f"\nDownloaded {downloaded_count} photos.")
print(f"Generated {len(sql_statements)} SQL INSERT statements.")

tar_path = 'photos.tar.gz'
with tarfile.open(tar_path, 'w:gz') as tar:
    for f in os.listdir('temp_photos'):
        p = os.path.join('temp_photos', f)
        tar.add(p, arcname=f)

print(f"Created photos.tar.gz successfully with {len(os.listdir('temp_photos'))} photos!")

with open('import_employees.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print("Created import_employees.sql successfully!")
