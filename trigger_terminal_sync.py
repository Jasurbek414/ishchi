import time
import json
import base64
import hmac
import hashlib
import urllib.request
import urllib.error
import csv

# JWT_SECRET from /opt/maktab_davomad/.env
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
print("Generated Admin JWT Token successfully.")

# Read failed student IDs from failed.csv
failed_ids = []
with open('/opt/maktab_davomad/failed.csv', 'r', encoding='utf-8') as f:
    for line in f:
        parts = line.strip().split('|')
        if len(parts) >= 1 and parts[0].isdigit():
            failed_ids.append(int(parts[0]))

print(f"Targeting {len(failed_ids)} previously failed students with newly fixed/normalized photos.")

# Trigger sync-all for these students
url = "http://localhost:8085/api/terminals/sync-all"
body = json.dumps({
    "schoolId": 2,
    "terminalId": "all",
    "studentIds": failed_ids
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
        print(f"Total students to sync: {res_data.get('totalStudents')}")
        print(f"Terminals count: {res_data.get('terminalsCount')}")
        jobs = res_data.get("jobs", [])
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode("utf-8"))
    jobs = []
except Exception as e:
    print("Error:", e)
    jobs = []

if not jobs:
    print("No jobs started, exiting.")
    exit(1)

print("\n--- Monitoring Face Sync Progress Across All 4 Terminals ---")
completed_jobs = set()

while len(completed_jobs) < len(jobs):
    time.sleep(4)
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
                
                print(f"[{tname}] Progress: {done}/{total} -> Muvaffaqiyatli: {success}, Xato: {failed}" + (f" (TO'XTATILDI: {abort})" if abort else ""))
                
                if finished:
                    completed_jobs.add(jid)
                    errs = s_data.get("errors", [])
                    if errs:
                        print(f"   -> Xatolar ro'yxati ({tname}):")
                        for err_item in errs[:5]:
                            print(f"      * {err_item.get('fullName')}: {err_item.get('error')}")
        except Exception as e:
            print(f"[{tname}] Status fetch error: {e}")

print("\nBARCHA TERMINALLARGA SINXRONIZATSIYA YAKUNLANDI!")
