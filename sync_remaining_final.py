import time
import json
import base64
import hmac
import hashlib
import urllib.request
import urllib.error
import os

# Clean up student 54 to NO_PHOTO if empty photo
os.system("docker exec maktab-db psql -U postgres -d maktabdb -c \"UPDATE students SET sync_status = 'NO_PHOTO' WHERE id = 54 AND (photo_url IS NULL OR photo_url = '');\"")

# Dump all students with photo that are not SYNCED
os.system("docker exec maktab-db psql -U postgres -d maktabdb -c \"COPY (SELECT id, full_name, face_id, photo_url FROM students WHERE photo_url IS NOT NULL AND photo_url != '' AND sync_status != 'SYNCED') TO '/tmp/remaining.csv' WITH CSV DELIMITER '|';\"")
os.system("docker cp maktab-db:/tmp/remaining.csv /opt/maktab_davomad/remaining.csv")

remaining_ids = []
with open('/opt/maktab_davomad/remaining.csv', 'r', encoding='utf-8') as f:
    for line in f:
        p = line.strip().split('|')
        if p and p[0].isdigit():
            remaining_ids.append(int(p[0]))
            print(f"To sync: #{p[0]} - {p[1]}")

print(f"\nTotal remaining students to sync: {len(remaining_ids)}")

if not remaining_ids:
    print("Zero remaining students! All students with photos are already SYNCED!")
    exit(0)

# JWT auth
secret = "0e3wXlISYdU7xMyUzrH+BdysbvIEKK/gBNAVLJkgIEImT0cWZ1+ALvoWPrAMlRBk"

def b64url(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

header = {"alg": "HS256", "typ": "JWT"}
now = int(time.time())
exp = now + 86400 * 7

payload = {
    "sub": "+998970504202",
    "role": "SUPERADMIN",
    "userId": 1,
    "iat": now,
    "exp": exp
}

enc_header = b64url(json.dumps(header, separators=(',', ':')))
enc_payload = b64url(json.dumps(payload, separators=(',', ':')))
signature = hmac.new(
    secret.encode('utf-8'),
    f"{enc_header}.{enc_payload}".encode('utf-8'),
    hashlib.sha256
).digest()
enc_sig = b64url(signature)

token = f"{enc_header}.{enc_payload}.{enc_sig}"

# Trigger sync-all for remaining
url = "http://localhost:8085/api/terminals/sync-all"
body = json.dumps({
    "schoolId": 2,
    "terminalId": "all",
    "studentIds": remaining_ids
}).encode("utf-8")

req = urllib.request.Request(
    url,
    data=body,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    },
    method="POST"
)

try:
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        print("\nSync Trigger Response:")
        print(json.dumps(res_data, indent=2))
        jobs = res_data.get("jobs", [])
except Exception as e:
    print("Error:", e)
    jobs = []

if not jobs:
    print("No jobs, exiting.")
    exit(1)

completed_jobs = set()
while len(completed_jobs) < len(jobs):
    time.sleep(3)
    for j in jobs:
        jid = j["jobId"]
        tid = j["terminalId"]
        tname = j.get("terminalName", f"Terminal {tid}")
        if jid in completed_jobs:
            continue
            
        status_url = f"http://localhost:8085/api/terminals/{tid}/sync-faces/{jid}"
        s_req = urllib.request.Request(
            status_url,
            headers={"Authorization": f"Bearer {token}"},
            method="GET"
        )
        try:
            with urllib.request.urlopen(s_req) as s_resp:
                s_data = json.loads(s_resp.read().decode("utf-8"))
                done = s_data.get("done", 0)
                total = s_data.get("total", 0)
                success = s_data.get("success", 0)
                failed = s_data.get("failed", 0)
                finished = s_data.get("finished", False)
                abort = s_data.get("abortReason")
                
                print(f"[{tname}] Progress: {done}/{total} (Success: {success}, Failed: {failed})" + (f" - ABORTED: {abort}" if abort else ""))
                
                if finished:
                    completed_jobs.add(jid)
                    errs = s_data.get("errors", [])
                    if errs:
                        for err_item in errs:
                            print(f"   * {err_item.get('fullName')}: {err_item.get('error')}")
        except Exception as e:
            print(f"[{tname}] Status fetch error: {e}")

print("\nFinal sync complete!")
