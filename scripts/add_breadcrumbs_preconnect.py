#!/usr/bin/env python3
"""
Add BreadcrumbList JSON-LD schema + preconnect tags to all pages.
Also add dns-prefetch for external resources (Infolinks, Google Analytics).
"""
import pathlib, re, json

root = pathlib.Path('/home/harvey/nexuswebtools')

PRECONNECT = '''<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
<link rel="dns-prefetch" href="http://resources.infolinks.com">
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
'''

breadcrumb_count = 0
preconnect_count = 0

for p in sorted(root.rglob('index.html')):
    if 'scripts' in str(p):
        continue
    rel = str(p.relative_to(root))
    if 'concrete-volume-calculator' in rel:
        continue
    
    txt = p.read_text(encoding='utf-8', errors='ignore')
    original = txt
    
    # 1. Add preconnect/dns-prefetch if missing
    if 'preconnect' not in txt and '<head>' in txt:
        txt = txt.replace('<head>', '<head>\n' + PRECONNECT, 1)
        preconnect_count += 1
    
    # 2. Add BreadcrumbList schema if missing
    if 'BreadcrumbList' not in txt and rel != 'index.html':
        # Build breadcrumb from path
        parts = rel.replace('/index.html', '').replace('index.html', '').strip('/').split('/')
        
        crumbs = [{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://nexuswebtools.com/"}]
        
        if len(parts) >= 1 and parts[0]:
            # Category page
            cat_name = parts[0].replace('-', ' ').title()
            cat_map = {'Compound Interest': 'Compound Interest', 'Unit Converter': 'Unit Converter',
                       'S-Curve': 'S-Curve', 'Percentage': 'Percentage', 'Gst': 'GST',
                       'Roi': 'ROI', 'Income Tax': 'Income Tax', 
                       'Capital Gains Tax': 'Capital Gains Tax', 'Stamp Duty': 'Stamp Duty'}
            cat_name = cat_map.get(cat_name, cat_name)
            crumbs.append({
                "@type": "ListItem",
                "position": 2,
                "name": cat_name,
                "item": f"https://nexuswebtools.com/{parts[0]}/"
            })
            
            if len(parts) >= 2:
                # Subpage
                sub_name = parts[1].replace('-', ' ').title()
                crumbs.append({
                    "@type": "ListItem",
                    "position": 3,
                    "name": sub_name,
                    "item": f"https://nexuswebtools.com/{'/'.join(parts)}/"
                })
        
        schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": crumbs
        }
        
        schema_html = f'<script type="application/ld+json">\n{json.dumps(schema, indent=2)}\n</script>\n'
        
        # Insert before </head>
        if '</head>' in txt:
            txt = txt.replace('</head>', schema_html + '</head>')
            breadcrumb_count += 1
    
    if txt != original:
        p.write_text(txt, encoding='utf-8')

print(f"Added preconnect/dns-prefetch to {preconnect_count} pages")
print(f"Added BreadcrumbList schema to {breadcrumb_count} pages")
