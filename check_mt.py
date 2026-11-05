import urllib.request
import json
import base64

auth = 'Basic ' + base64.b64encode(b'admin:Admin@123').decode()

def get(path):
    r = urllib.request.Request(f'http://192.168.88.1/rest/{path}', headers={'Authorization': auth})
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode())

filters = get('ip/firewall/filter')
print('=== FIREWALL FILTER RULES ===')
for i, f in enumerate(filters):
    print(f"{i}: id={f.get('.id')} chain={f.get('chain')} action={f.get('action')} proto={f.get('protocol')} port={f.get('dst-port')} comment={f.get('comment')}")

nat = get('ip/firewall/nat')
print('\n=== NAT RULES ===')
for i, n in enumerate(nat):
    print(f"{i}: id={n.get('.id')} chain={n.get('chain')} action={n.get('action')} src={n.get('src-address')} dst={n.get('dst-address')} comment={n.get('comment')}")
