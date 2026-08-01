#!/usr/bin/env python3
"""
Add cross-linking between related calculator pages.
Google relies on internal links to discover and rank pages.
"""
import pathlib, re

root = pathlib.Path('/home/harvey/nexuswebtools')

# Define link clusters — pages that should link to each other
LINK_CLUSTERS = {
    'finance': {
        'pages': [
            '/compound-interest/', '/mortgage/', '/percentage/', '/gst/', '/roi/',
            '/income-tax/', '/capital-gains-tax/', '/stamp-duty/',
            '/compound-interest/savings/', '/compound-interest/retirement/',
            '/compound-interest/investments/', '/compound-interest/home-loan/',
            '/compound-interest/mortgage/', '/compound-interest/car-loan/',
            '/compound-interest/credit-card/', '/compound-interest/superannuation/',
        ],
        'title': 'Related Finance Calculators',
    },
    'compound_interest': {
        'pages': [
            '/compound-interest/', '/compound-interest/annually/', '/compound-interest/monthly/',
            '/compound-interest/daily/', '/compound-interest/continuous/', '/compound-interest/quarterly/',
            '/compound-interest/compound-frequency/', '/compound-interest/simple-vs-compound/',
            '/compound-interest/rule-of-72/', '/compound-interest/savings/',
            '/compound-interest/retirement/', '/compound-interest/investments/',
        ],
        'title': 'More Compound Interest Tools',
    },
    'unit_converter': {
        'pages': [
            '/unit-converter/', '/unit-converter/length/', '/unit-converter/weight/',
            '/unit-converter/temperature/', '/unit-converter/area/', '/unit-converter/volume/',
            '/unit-converter/speed/', '/unit-converter/pressure/', '/unit-converter/energy/',
            '/unit-converter/data/', '/unit-converter/time/', '/unit-converter/power/',
        ],
        'title': 'More Unit Converters',
    },
}

count = 0
for cluster_name, cluster in LINK_CLUSTERS.items():
    for page_url in cluster['pages']:
        # Convert URL to file path
        page_path = root / page_url.strip('/') / 'index.html'
        if not page_path.exists():
            continue
        
        txt = page_path.read_text(encoding='utf-8', errors='ignore')
        
        # Skip if already has this cluster's links
        if cluster['title'] in txt:
            continue
        
        # Build link HTML (exclude current page)
        links = [p for p in cluster['pages'] if p != page_url]
        link_html = '\n      '.join(f'<a href="{p}">{p.split("/")[-2].replace("-"," ").title()}</a>' for p in links[:8])
        
        section = f'''
  <section class="related-tools">
    <h2>{cluster['title']}</h2>
    <div class="related-links">
      {link_html}
    </div>
  </section>
'''
        
        # Insert before </main>
        if '</main>' in txt:
            txt = txt.replace('</main>', section + '</main>')
            page_path.write_text(txt, encoding='utf-8')
            count += 1

print(f"Added cross-linking to {count} pages")
