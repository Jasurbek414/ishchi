import urllib.request
import json
import base64
import random

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

# Choose a fresh random wgPort
wg_port = random.randint(25000, 55000)
print(f'Using fresh WireGuard listen port: {wg_port}')

# Clean up all existing ecos_crm configs
print("1. Cleaning up...")
for p in req('GET', 'interface/wireguard/peers') or []:
    req('DELETE', f"interface/wireguard/peers/{p['.id']}")

for a in req('GET', 'ip/address') or []:
    if a.get('comment') == 'ecos_crm':
        req('DELETE', f"ip/address/{a['.id']}")

for w in req('GET', 'interface/wireguard') or []:
    if w.get('name') == 'wg-ecoscrm' or w.get('comment') == 'ecos_crm':
        req('DELETE', f"interface/wireguard/{w['.id']}")

for f in req('GET', 'ip/firewall/filter') or []:
    if 'ecos_crm' in f.get('comment', ''):
        req('DELETE', f"ip/firewall/filter/{f['.id']}")

for n in req('GET', 'ip/firewall/nat') or []:
    if 'ecos_crm' in n.get('comment', ''):
        req('DELETE', f"ip/firewall/nat/{n['.id']}")

# 2. Add WireGuard interface
print("2. Adding WireGuard interface...")
res = req('PUT', 'interface/wireguard', {
    'name': 'wg-ecoscrm',
    'listen-port': str(wg_port),
    'mtu': '1420',
    'private-key': 'w8AJA74oe62F8T4pViaMVFBytIW49elD60SH7qB91+k=',
    'comment': 'ecos_crm'
})
print('WG interface:', res)

# 3. Add IP address
print("3. Adding IP address...")
res = req('PUT', 'ip/address', {
    'address': '10.40.0.4/24',
    'interface': 'wg-ecoscrm',
    'comment': 'ecos_crm'
})
print('IP address:', res)

# 4. Add peer
print("4. Adding peer...")
res = req('PUT', 'interface/wireguard/peers', {
    'interface': 'wg-ecoscrm',
    'public-key': 'UfiFlSBr1vnA1UcoTxPe7mUx0NL3y0XYNq4TAzqt2zQ=',
    'endpoint-address': '62.169.27.106',
    'endpoint-port': '51830',
    'allowed-address': '10.40.0.0/24',
    'persistent-keepalive': '25s',
    'comment': 'ecos_crm'
})
print('Peer:', res)

# 5. Add NAT rules AT THE TOP (place-before)
print("5. Adding NAT rules...")
nat_list = req('GET', 'ip/firewall/nat') or []
first_nat = nat_list[0]['.id'] if nat_list else None

# srcnat masquerade: server -> LAN
srcnat_rule = {
    'chain': 'srcnat',
    'src-address': '10.40.0.254',
    'dst-address': '192.168.88.0/24',
    'action': 'masquerade',
    'comment': 'ecos_crm: server -> LAN'
}
if first_nat:
    srcnat_rule['place-before'] = first_nat
req('PUT', 'ip/firewall/nat', srcnat_rule)

# dstnat netmap: 10.50.4.0/24 -> 192.168.88.0/24
nat_list = req('GET', 'ip/firewall/nat') or []
first_nat = nat_list[0]['.id'] if nat_list else None
dstnat_rule = {
    'chain': 'dstnat',
    'in-interface': 'wg-ecoscrm',
    'dst-address': '10.50.4.0/24',
    'action': 'netmap',
    'to-addresses': '192.168.88.0/24',
    'comment': 'ecos_crm: netmap'
}
if first_nat:
    dstnat_rule['place-before'] = first_nat
req('PUT', 'ip/firewall/nat', dstnat_rule)

# 6. Add Filter rules AT THE TOP (place-before)
print("6. Adding Filter rules...")
filters = req('GET', 'ip/firewall/filter') or []
first_filter = filters[0]['.id'] if filters else None

# Forward accept: server -> LAN
fwd_rule = {
    'chain': 'forward',
    'in-interface': 'wg-ecoscrm',
    'src-address': '10.40.0.254',
    'dst-address': '192.168.88.0/24',
    'action': 'accept',
    'comment': 'ecos_crm: server -> LAN'
}
if first_filter:
    fwd_rule['place-before'] = first_filter
req('PUT', 'ip/firewall/filter', fwd_rule)

# Forward drop: other VPN traffic
filters = req('GET', 'ip/firewall/filter') or []
second_filter = filters[1]['.id'] if len(filters) > 1 else None
fwd_drop = {
    'chain': 'forward',
    'in-interface': 'wg-ecoscrm',
    'action': 'drop',
    'comment': 'ecos_crm: boshqa VPN trafik'
}
if second_filter:
    fwd_drop['place-before'] = second_filter
req('PUT', 'ip/firewall/filter', fwd_drop)

# Input accept: UDP port for hub reply
input_rule = {
    'chain': 'input',
    'protocol': 'udp',
    'dst-port': str(wg_port),
    'action': 'accept',
    'comment': 'ecos_crm: hub javobi'
}
filters = req('GET', 'ip/firewall/filter') or []
first_input = next((f['.id'] for f in filters if f.get('chain') == 'input'), None)
if first_input:
    input_rule['place-before'] = first_input
req('PUT', 'ip/firewall/filter', input_rule)

print("Finished setting up MikroTik!")
