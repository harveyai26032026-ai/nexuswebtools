#!/usr/bin/env python3
"""Add Infolinks ad code + lang-loader to all HTML pages that don't have it."""
import pathlib, re

root = pathlib.Path('/home/harvey/nexuswebtools')
INFOLINKS = '<script type="text/javascript">var infolinks_pid = 3446367;var infolinks_wsid = 0;</script><script type="text/javascript" src="http://resources.infolinks.com/js/infolinks_main.js"></script>'

count = 0
for html_path in root.rglob('*.html'):
    if 'scripts' in str(html_path):
        continue
    try:
        txt = html_path.read_text(encoding='utf-8')
    except:
        continue
    
    original = txt
    
    # Add Infolinks before </body> if not present
    if 'infolinks' not in txt and '</body>' in txt:
        txt = txt.replace('</body>', INFOLINKS + '\n</body>')
    
    # Add lang-loader if not present
    if 'lang-loader.js' not in txt and '</body>' in txt:
        txt = txt.replace('</body>', '<script src="/lang-loader.js" defer></script>\n</body>')
    
    if txt != original:
        html_path.write_text(txt, encoding='utf-8')
        count += 1
        print(f"Fixed: {html_path}")

print(f"\nDone — {count} pages updated")
