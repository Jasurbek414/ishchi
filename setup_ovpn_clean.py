import urllib.request
import json
import base64
import time

auth = 'Basic ' + base64.b64encode(b'admin:Admin@123').decode()

def req(method, path, data=None):
    url = f'http://192.168.88.1/rest/{path}'
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers={'Authorization': auth, 'Content-Type': 'application/json'}, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            content = resp.read().decode()
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        print(f'Error {method} {path}: {e.code} {e.read().decode()}')
        return None

print("1. Removing WireGuard interface and old items...")
wg = req('GET', 'interface/wireguard')
for w in (wg or []):
    if w.get('name') == 'wg-ecoscrm':
        req('DELETE', f'interface/wireguard/{w[".id"]}')

ovpn = req('GET', 'interface/ovpn-client')
for o in (ovpn or []):
    if o.get('name') == 'ovpn-ecoscrm':
        req('DELETE', f'interface/ovpn-client/{o[".id"]}')

addresses = req('GET', 'ip/address')
for a in (addresses or []):
    if a.get('comment') == 'ecos_crm':
        req('DELETE', f'ip/address/{a[".id"]}')

routes = req('GET', 'ip/route')
for r in (routes or []):
    if r.get('comment') == 'ecos_crm':
        req('DELETE', f'ip/route/{r[".id"]}')

print("2. Adding OpenVPN client interface...")
new_ovpn = {
    'name': 'ovpn-ecoscrm',
    'connect-to': '62.169.27.106',
    'port': '8443',
    'protocol': 'tcp',
    'mode': 'ip',
    'user': 'crm3',
    'password': 'cDV5okmUajNUH7uvnwd2K9HL',
    'cipher': 'aes256-gcm',
    'auth': 'sha1',
    'add-default-route': 'false',
    'comment': 'ecos_crm',
    'disabled': 'false'
}
res = req('PUT', 'interface/ovpn-client', new_ovpn)
print('ovpn-client:', res)

time.sleep(3)

print("3. Adding Route for 10.40.0.254...")
req('PUT', 'ip/route', {
    'dst-address': '10.40.0.254/32',
    'gateway': 'ovpn-ecoscrm',
    'comment': 'ecos_crm'
})

print("4. Adding NAT (netmap without interface constraint so it is always active)...")
nat = req('GET', 'ip/firewall/nat')
for n in (nat or []):
    if 'ecos_crm' in n.get('comment', ''):
        req('DELETE', f'ip/firewall/nat/{n[".id"]}')

# Place before first NAT rule
first_nat = nat[0]['.id'] if nat else None

req('PUT', 'ip/firewall/nat', {
    'chain': 'dstnat',
    'dst-address': '10.50.4.0/24',
    'action': 'netmap',
    'to-addresses': '192.168.88.0/24',
    'comment': 'ecos_crm: netmap',
    'place-before': first_nat
})
req('PUT', 'ip/firewall/nat', {
    'chain': 'srcnat',
    'src-address': '10.40.0.254',
    'dst-address': '192.168.88.0/24',
    'action': 'masquerade',
    'comment': 'ecos_crm: server -> LAN',
    'place-before': first_nat
})

print("5. Adding Filter (forward rule placed before defconf drops)...")
filters = req('GET', 'ip/firewall/filter')
for f in (filters or []):
    if 'ecos_crm' in f.get('comment', ''):
        req('DELETE', f'ip/firewall/filter/{f[".id"]}')

filters = req('GET', 'ip/firewall/filter')
first_forward = None
for f in (filters or []):
    if f.get('chain') == 'forward':
        first_forward = f['.id']
        break

req('PUT', 'ip/firewall/filter', {
    'chain': 'forward',
    'src-address': '10.40.0.254',
    'dst-address': '192.168.88.0/24',
    'action': 'accept',
    'comment': 'ecos_crm: server -> LAN',
    'place-before': first_forward
})

print("Setup completed!")
