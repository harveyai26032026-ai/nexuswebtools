#!/usr/bin/env python3
"""
Fix language support on all pages:
1. Add lang-loader.js to pages missing it
2. Add data-i18n attributes to common elements (brand, nav links, h1, title)
3. Add page-specific translation keys to all locale files
"""
import pathlib, re, json

root = pathlib.Path('/home/harvey/nexuswebtools')

# Common keys that are the same on every page
COMMON_KEYS = {
    'brand': '🧰 Nexus Web Tools',
    'navHome': 'Home',
    'navTools': 'Tools',
    'navFAQ': 'FAQ',
}

# Page-specific keys: extract from each page's <title> and <h1>
# We'll collect these and add them to all locale files
page_keys = {}

# ─── Step 1: Fix lang-loader.js and add data-i18n to common elements ───
loader_count = 0
i18n_count = 0

for p in sorted(root.rglob('index.html')):
    if 'scripts' in str(p):
        continue
    
    txt = p.read_text(encoding='utf-8', errors='ignore')
    original = txt
    rel = str(p.relative_to(root))
    
    # Skip concrete-volume-calculator (separate submodule)
    if 'concrete-volume-calculator' in rel:
        continue
    
    # 1. Add lang-loader.js if missing
    if 'lang-loader.js' not in txt:
        if '</body>' in txt:
            txt = txt.replace('</body>', '<script src="/lang-loader.js" defer></script>\n</body>')
            loader_count += 1
    
    # 2. Add data-i18n to brand link if not present
    if 'data-i18n="brand"' not in txt:
        txt = txt.replace(
            '🧰 Nexus Web Tools',
            '🧰 Nexus Web Tools'
        )
        # Find the brand link and add data-i18n
        txt = re.sub(
            r'(class="brand".*?>)🧰 Nexus Web Tools',
            r'\1<span data-i18n="brand">🧰 Nexus Web Tools</span>',
            txt
        )
    
    # 3. Add data-i18n to nav links
    if 'data-i18n="navHome"' not in txt:
        txt = re.sub(r'<a href="/">Home</a>', '<a href="/"><span data-i18n="navHome">Home</span></a>', txt)
    if 'data-i18n="navTools"' not in txt:
        txt = re.sub(r'<a href="/#tools">Tools</a>', '<a href="/#tools"><span data-i18n="navTools">Tools</span></a>', txt)
    if 'data-i18n="navFAQ"' not in txt:
        txt = re.sub(r'<a href="#faq">FAQ</a>', '<a href="#faq"><span data-i18n="navFAQ">FAQ</span></a>', txt)
    
    # 4. Add data-i18n to page title
    title_match = re.search(r'<title>([^<]+)</title>', txt)
    if title_match and 'data-i18n' not in title_match.group(0):
        title_text = title_match.group(1).strip()
        # Generate a page-specific key
        if rel == 'index.html':
            key = 'page_home_title'
        else:
            # Convert path to key: compound-interest/savings/index.html -> page_ci_savings_title
            parts = rel.replace('/index.html', '').replace('index.html', '').split('/')
            if len(parts) > 1:
                # Abbreviate common prefixes
                prefix_map = {'compound-interest': 'ci', 'unit-converter': 'uc', 's-curve': 'sc'}
                parts[0] = prefix_map.get(parts[0], parts[0][:6])
                key = 'page_' + '_'.join(parts) + '_title'
            else:
                key = 'page_' + parts[0] + '_title'
        
        key = re.sub(r'[^a-z0-9_]', '_', key)
        page_keys[key] = title_text
        txt = txt.replace(f'<title>{title_text}</title>', f'<title data-i18n="{key}">{title_text}</title>')
    
    # 5. Add data-i18n to H1
    h1_match = re.search(r'<h1[^>]*>([^<]+)</h1>', txt)
    if h1_match and 'data-i18n' not in h1_match.group(0):
        h1_text = h1_match.group(1).strip()
        if rel == 'index.html':
            key = 'page_home_h1'
        else:
            parts = rel.replace('/index.html', '').replace('index.html', '').split('/')
            if len(parts) > 1:
                prefix_map = {'compound-interest': 'ci', 'unit-converter': 'uc', 's-curve': 'sc'}
                parts[0] = prefix_map.get(parts[0], parts[0][:6])
                key = 'page_' + '_'.join(parts) + '_h1'
            else:
                key = 'page_' + parts[0] + '_h1'
        
        key = re.sub(r'[^a-z0-9_]', '_', key)
        page_keys[key] = h1_text
        # Add data-i18n to the h1 tag
        old_h1 = h1_match.group(0)
        new_h1 = old_h1.replace('>', f' data-i18n="{key}">', 1)
        txt = txt.replace(old_h1, new_h1)
    
    if txt != original:
        p.write_text(txt, encoding='utf-8')
        i18n_count += 1

print(f"Step 1: Added lang-loader.js to {loader_count} pages")
print(f"Step 1: Added data-i18n attributes to {i18n_count} pages")
print(f"Collected {len(page_keys)} page-specific keys")

# ─── Step 2: Update all locale files with the new keys ───
locales_dir = root / 'locales'
for locale_file in locales_dir.glob('*.json'):
    try:
        data = json.loads(locale_file.read_text(encoding='utf-8'))
    except:
        data = {}
    
    # Add common keys if missing (use English values as placeholder for non-English)
    for k, v in COMMON_KEYS.items():
        if k not in data:
            data[k] = v
    
    # Add page-specific keys (use English values for all locales)
    # The translator will need to fill these in, but at least the keys exist
    for k, v in page_keys.items():
        if k not in data:
            data[k] = v
    
    locale_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"  Updated {locale_file.name}: {len(data)} total keys")

print(f"\nDone!")
