"""Bundle the aquarium into one HTML file that also runs from file://."""
from pathlib import Path
import base64
import json
import re

root = Path(__file__).parent
dist = root / 'dist'
def data(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()

html = (dist / 'index.html').read_text()
css = (dist / 'interaction-kit.css').read_text() + '\n' + (dist / 'style.css').read_text()
for name in ['geologica-latin.woff2', 'geologica-cyrillic.woff2']:
    css = css.replace('./' + name, data(dist / name, 'font/woff2'))
html = re.sub(r'<link rel="stylesheet"[^>]+>', '', html)
html = html.replace('</head>', '<style>' + css + '</style></head>')
imports = {'three': data(dist / 'vendor/three.module.js', 'text/javascript')}
for name in ['OrbitControls', 'RoomEnvironment', 'Water', 'BufferGeometryUtils']:
    imports['aqua/' + name] = data(dist / ('vendor/' + name + '.js'), 'text/javascript')
html = re.sub(r'<script type="importmap">.*?</script>', '<script type="importmap">' + json.dumps({'imports': imports}) + '</script>', html)
html = html.replace('<script src="./interaction-kit.js"></script>', '<script>' + (dist / 'interaction-kit.js').read_text() + '</script>')
app = (dist / 'app.js').read_text()
for name in ['OrbitControls', 'RoomEnvironment', 'Water', 'BufferGeometryUtils']:
    app = app.replace('./vendor/' + name + '.js', 'aqua/' + name)
# Dynamic import retains the visible error/retry state on browsers without WebGL.
app_url = 'data:text/javascript;base64,' + base64.b64encode(app.encode()).decode()
html = html.replace("import('./app.js')", 'import(' + json.dumps(app_url) + ')')
for name in ['THREE-LICENSE.txt', 'GEOLOGICA-LICENSE.txt', 'LUCIDE-LICENSE.txt']:
    html += '\n<!-- ' + name + '\n' + (dist / 'vendor' / name).read_text().replace('--', '—') + '\n-->\n'
(root / 'aquarium.html').write_text(html)
print('aquarium.html:', len(html.encode()), 'bytes; all assets embedded')
