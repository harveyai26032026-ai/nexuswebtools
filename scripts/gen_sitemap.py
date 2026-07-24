#!/usr/bin/env python3
"""Regenerate sitemap with lastmod dates to trigger Google re-crawl."""
import pathlib, datetime, os

root = pathlib.Path('/home/harvey/nexuswebtools')
today = datetime.date.today().isoformat()

# Find all index.html pages
urls = []
for html_path in sorted(root.rglob('index.html')):
    if 'scripts' in str(html_path):
        continue
    rel = html_path.relative_to(root)
    # Convert path to URL
    if str(rel) == 'index.html':
        url = 'https://nexuswebtools.com/'
        priority = '1.0'
    elif str(rel).startswith('compound-interest/') and rel.parent.name != 'compound-interest':
        url = f'https://nexuswebtools.com/{rel.parent}/'
        priority = '0.7'
    elif str(rel).startswith('unit-converter/') and rel.parent.name != 'unit-converter':
        url = f'https://nexuswebtools.com/{rel.parent}/'
        priority = '0.7'
    elif str(rel).startswith('s-curve/') and rel.parent.name != 's-curve':
        url = f'https://nexuswebtools.com/{rel.parent}/'
        priority = '0.7'
    else:
        url = f'https://nexuswebtools.com/{rel.parent}/'
        priority = '0.8'
    
    # Get last modified date
    mtime = os.path.getmtime(html_path)
    lastmod = datetime.date.fromtimestamp(mtime).isoformat()
    urls.append((url, priority, lastmod))

# Write sitemap
xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for url, priority, lastmod in urls:
    xml += f'  <url>\n'
    xml += f'    <loc>{url}</loc>\n'
    xml += f'    <lastmod>{lastmod}</lastmod>\n'
    xml += f'    <changefreq>weekly</changefreq>\n'
    xml += f'    <priority>{priority}</priority>\n'
    xml += f'  </url>\n'
xml += '</urlset>\n'

(root / 'sitemap.xml').write_text(xml)
print(f"Sitemap generated with {len(urls)} URLs (all with lastmod={today})")
