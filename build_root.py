#!/usr/bin/env python3
"""Rebuild the root single-file index.html (GitHub Pages build) from docs/.

Inlines css/styles.css into <style>, js/app.js into <script>, and base64-embeds
the image assets referenced from the HTML and the CSS. Keeps the root build in
sync with docs/ without changing any behaviour.
"""
import base64, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(ROOT, 'docs')

def datauri(path):
    ext = os.path.splitext(path)[1].lower().lstrip('.')
    mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
            'gif': 'image/gif', 'svg': 'image/svg+xml', 'webp': 'image/webp'}.get(ext, 'application/octet-stream')
    with open(path, 'rb') as f:
        return 'data:%s;base64,%s' % (mime, base64.b64encode(f.read()).decode('ascii'))

html = open(os.path.join(DOCS, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(DOCS, 'css', 'styles.css'), encoding='utf-8').read()
js = open(os.path.join(DOCS, 'js', 'app.js'), encoding='utf-8').read()

# 1) Inline image assets inside the CSS (url("../assets/x") -> url(data:...)).
def css_asset(m):
    rel = m.group(1).strip('\'"')
    name = os.path.basename(rel)
    p = os.path.join(DOCS, 'assets', name)
    return 'url("%s")' % datauri(p) if os.path.exists(p) else m.group(0)
css = re.sub(r'url\(([^)]*assets/[^)]+)\)', css_asset, css)

# 2) Replace the stylesheet <link> with an inline <style>.
#    (Use a function replacement so backslashes in the content are kept literal.)
style_block = '<style>\n' + css + '\n</style>'
html = re.sub(r'<link rel="stylesheet" href="css/styles\.css[^"]*">',
              lambda m: style_block, html)

# 3) Inline image assets referenced from the HTML (src/href="assets/x").
def html_asset(m):
    attr, rel = m.group(1), m.group(2)
    name = os.path.basename(rel)
    p = os.path.join(DOCS, 'assets', name)
    return '%s="%s"' % (attr, datauri(p)) if os.path.exists(p) else m.group(0)
html = re.sub(r'(src|href)="(assets/[^"]+)"', html_asset, html)

# 4) Replace the app.js <script src> with an inline <script>.
script_block = '<script>\n' + js + '\n</script>'
html = re.sub(r'<script src="js/app\.js"></script>',
              lambda m: script_block, html)

open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)

# Sanity checks.
assert 'href="css/styles.css' not in html, 'stylesheet link not inlined'
assert 'src="js/app.js"' not in html, 'app.js not inlined'
assert 'src="assets/' not in html and 'href="assets/' not in html, 'assets not inlined'
print('root index.html rebuilt: %d bytes, %d data URIs' % (len(html), html.count('data:image')))
