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

print("1. Removing ovpn-client and routes...")
ovpn = req('GET', 'interface/ovpn-client')
for o in (ovpn or []):
    if o.get('name') == 'ovpn-ecoscrm':
        req('DELETE', f'interface/ovpn-client/{o[".id"]}')

routes = req('GET', 'ip/route')
for r in (routes or []):
    if r.get('comment') == 'ecos_crm':
        req('DELETE', f'ip/route/{r[".id"]}')

addresses = req('GET', 'ip/address')
for a in (addresses or []):
    if a.get('comment') == 'ecos_crm':
        req('DELETE', f'ip/address/{a[".id"]}')

wg_list = req('GET', 'interface/wireguard')
for w in (wg_list or []):
    if w.get('name') == 'wg-ecoscrm':
        req('DELETE', f'interface/wireguard/{w[".id"]}')

print("2. Adding WireGuard interface with fixed port 51830...")
wg_port = 51830
new_wg = {
    'name': 'wg-ecoscrm',
    'listen-port': str(wg_port),
    'mtu': '1420',
    'private-key': 'w8AJA74oe62F8T4pViaMVFBytIW49elD60SH7qB91+k=',
    'comment': 'ecos_crm'
}
res = req('PUT', 'interface/wireguard', new_wg)
print('Wireguard interface:', res)

print("3. Adding WireGuard IP address 10.40.0.4/24...")
res = req('PUT', 'ip/address', {
    'address': '10.40.0.4/24',
    'interface': 'wg-ecoscrm',
    'comment': 'ecos_crm'
})
print('IP address:', res)

print("4. Adding WireGuard peer...")
new_peer = {
    'interface': 'wg-ecoscrm',
    'public-key': 'UfiFlSBr1vnA1UcoTxPe7mUx0NL3y0XYNq4TAzqt2zQ=',
    'endpoint-address': '62.169.27.106',
    'endpoint-port': '51830',
    'allowed-address': '10.40.0.0/24',
    'persistent-keepalive': '25s',
    'comment': 'ecos_crm'
}
res = req('PUT', 'interface/wireguard/peers', new_peer)
print('Wireguard peer:', res)

print("5. Updating NAT...")
nat = req('GET', 'ip/firewall/nat')
for n in (nat or []):
    if 'ecos_crm' in n.get('comment', ''):
        req('DELETE', f'ip/firewall/nat/{n[".id"]}')

req('PUT', 'ip/firewall/nat', {
    'chain': 'dstnat',
    'in-interface': 'wg-ecoscrm',
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

print("6. Updating Filter and placing input rule at the top...")
filters = req('GET', 'ip/firewall/filter')
for f in (filters or []):
    if 'ecos_crm' in f.get('comment', ''):
        req('DELETE', f'ip/firewall/filter/{f[".id"]}')

# Forward rules
req('PUT', 'ip/firewall/filter', {
    'chain': 'forward',
    'in-interface': 'wg-ecoscrm',
    'src-address': '10.40.0.254',
    'dst-address': '192.168.88.0/24',
    'action': 'accept',
    'comment': 'ecos_crm: server -> LAN'
})
req('PUT', 'ip/firewall/filter', {
    'chain': 'forward',
    'in-interface': 'wg-ecoscrm',
    'action': 'drop',
    'comment': 'ecos_crm: boshqa VPN trafik'
})

# Find first input rule to place before it
filters = req('GET', 'ip/firewall/filter')
first_input_id = None
for f in (filters or []):
    if f.get('chain') == 'input':
        first_input_id = f['.id']
        break

input_rule = {
    'chain': 'input',
    'protocol': 'udp',
    'dst-port': str(wg_port),
    'action': 'accept',
    'comment': 'ecos_crm: hub javobi'
}
if first_input_id:
    input_rule['place-before'] = first_input_id

print('Adding input rule (place-before:', first_input_id, ')...')
res = req('PUT', 'ip/firewall/filter', input_rule)
print('Input rule result:', res)

print("MikroTik WireGuard setup finished!")
