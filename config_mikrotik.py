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

print("1. Cleaning old wireguard...")
wg = req('GET', 'interface/wireguard')
for w in (wg or []):
    if w.get('name') == 'wg-ecoscrm':
        print('Removing wg interface:', w['.id'])
        req('DELETE', f'interface/wireguard/{w[".id"]}')

print("2. Cleaning old OpenVPN...")
ovpn = req('GET', 'interface/ovpn-client')
for o in (ovpn or []):
    if o.get('name') == 'ovpn-ecoscrm':
        print('Removing ovpn interface:', o['.id'])
        req('DELETE', f'interface/ovpn-client/{o[".id"]}')

print("3. Adding new OpenVPN client...")
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
print('ovpn-client result:', res)

print("4. Cleaning and setting routes...")
routes = req('GET', 'ip/route')
for r in (routes or []):
    if r.get('comment') == 'ecos_crm':
        req('DELETE', f'ip/route/{r[".id"]}')

# Wait 2 seconds for interface to come up
time.sleep(2)

new_route = {
    'dst-address': '10.40.0.254/32',
    'gateway': 'ovpn-ecoscrm',
    'comment': 'ecos_crm'
}
res = req('PUT', 'ip/route', new_route)
print('Route result:', res)

print("5. Cleaning and updating NAT...")
nat = req('GET', 'ip/firewall/nat')
for n in (nat or []):
    if 'ecos_crm' in n.get('comment', ''):
        req('DELETE', f'ip/firewall/nat/{n[".id"]}')

req('PUT', 'ip/firewall/nat', {
    'chain': 'dstnat',
    'in-interface': 'ovpn-ecoscrm',
    'dst-address': '10.50.4.0/24',
    'action': 'netmap',
    'to-addresses': '192.168.88.0/24',
    'comment': 'ecos_crm: netmap'
})
req('PUT', 'ip/firewall/nat', {
    'chain': 'srcnat',
    'src-address': '10.40.0.254',
    'dst-address': '192.168.88.0/24',
    'action': 'masquerade',
    'comment': 'ecos_crm: server -> LAN'
})

print("6. Cleaning and updating filter...")
filters = req('GET', 'ip/firewall/filter')
for f in (filters or []):
    if 'ecos_crm' in f.get('comment', ''):
        req('DELETE', f'ip/firewall/filter/{f[".id"]}')

req('PUT', 'ip/firewall/filter', {
    'chain': 'forward',
    'in-interface': 'ovpn-ecoscrm',
    'src-address': '10.40.0.254',
    'dst-address': '192.168.88.0/24',
    'action': 'accept',
    'comment': 'ecos_crm: server -> LAN'
})
req('PUT', 'ip/firewall/filter', {
    'chain': 'forward',
    'in-interface': 'ovpn-ecoscrm',
    'action': 'drop',
    'comment': 'ecos_crm: boshqa VPN trafik'
})

print("Done! Checking OpenVPN interface status...")
time.sleep(3)
ovpn_status = req('GET', 'interface/ovpn-client')
print('OpenVPN status:', ovpn_status)
