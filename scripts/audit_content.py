#!/usr/bin/env python3
"""Audit all pages for content quality — word count, structure, thin content detection."""
import pathlib, re

root = pathlib.Path('/home/harvey/nexuswebtools')
results = []

for html_path in sorted(root.rglob('index.html')):
    if 'scripts' in str(html_path):
        continue
    try:
        txt = html_path.read_text(encoding='utf-8')
    except:
        continue
    
    # Strip HTML tags for word count
    text = re.sub(r'<script[^>]*>.*?</script>', '', txt, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    words = len(text.split())
    
    # Check for key elements
    has_title = '<title' in txt.lower()
    has_meta_desc = 'name="description"' in txt
    has_h1 = '<h1' in txt
    has_h2 = txt.count('<h2')
    has_h3 = txt.count('<h3')
    has_faq = 'faq' in txt.lower() or 'frequently' in txt.lower()
    has_schema = 'application/ld+json' in txt
    has_table = '<table' in txt
    has_canonical = 'rel="canonical"' in txt
    has_internal_links = txt.count('href="/') + txt.count('href="../')
    
    # Determine page type
    rel = html_path.relative_to(root)
    if str(rel) == 'index.html':
        ptype = 'homepage'
    elif 'compound-interest' in str(rel):
        ptype = 'compound-interest'
    elif 'unit-converter' in str(rel):
        ptype = 'unit-converter'
    elif 's-curve' in str(rel):
        ptype = 's-curve'
    else:
        ptype = 'other'
    
    # Quality score
    score = 0
    if words > 500: score += 2
    elif words > 200: score += 1
    if has_meta_desc: score += 1
    if has_schema: score += 1
    if has_faq: score += 1
    if has_h2 >= 2: score += 1
    if has_table: score += 1
    if has_internal_links >= 3: score += 1
    
    quality = 'GOOD' if score >= 6 else 'OK' if score >= 4 else 'THIN'
    
    results.append({
        'path': str(html_path.relative_to(root)),
        'words': words,
        'quality': quality,
        'score': score,
        'h2': has_h2,
        'h3': has_h3,
        'faq': has_faq,
        'schema': has_schema,
        'table': has_table,
        'type': ptype,
    })

# Sort by word count (thinnest first)
results.sort(key=lambda x: x['words'])

# Summary
thin = [r for r in results if r['quality'] == 'THIN']
ok = [r for r in results if r['quality'] == 'OK']
good = [r for r in results if r['quality'] == 'GOOD']

print(f"{'='*70}")
print(f"  CONTENT QUALITY AUDIT — nexuswebtools.com")
print(f"  Total pages: {len(results)}")
print(f"  GOOD: {len(good)} | OK: {len(ok)} | THIN: {len(thin)}")
print(f"{'='*70}\n")

print(f"{'PATH':<55} {'WORDS':>6} {'QUALITY':>8} {'H2':>3} {'FAQ':>4} {'SCH':>4}")
print('-' * 85)
for r in results[:40]:
    print(f"{r['path']:<55} {r['words']:>6} {r['quality']:>8} {r['h2']:>3} {'Y' if r['faq'] else 'N':>4} {'Y' if r['schema'] else 'N':>4}")

if len(results) > 40:
    print(f"  ... and {len(results)-40} more pages")

print(f"\n{'THIN PAGES NEEDING CONTENT:'}")
for r in thin:
    print(f"  {r['path']:<55} {r['words']:>6} words")
