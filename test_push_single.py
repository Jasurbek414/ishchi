import urllib.request
import json
import base64
import hmac
import hashlib

secret = "0e3wXlISYdU7xMyUzrH+BdysbvIEKK/gBNAVLJkgIEImT0cWZ1+ALvoWPrAMlRBk"

def b64url(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

header = {"alg": "HS256", "typ": "JWT"}
payload = {"sub": "+998970504202", "role": "SUPERADMIN", "userId": 1, "iat": 1700000000, "exp": 2000000000}
enc_h = b64url(json.dumps(header))
enc_p = b64url(json.dumps(payload))
sig = b64url(hmac.new(secret.encode('utf-8'), f"{enc_h}.{enc_p}".encode('utf-8'), hashlib.sha256).digest())
token = f"{enc_h}.{enc_p}.{sig}"

sids = [610, 617, 621, 651]
for sid in sids:
    url = f"http://localhost:8085/api/terminals/13/students/{sid}/face"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"}, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Student #{sid} -> Success: {resp.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"Student #{sid} -> HTTP {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Student #{sid} -> Error: {e}")
