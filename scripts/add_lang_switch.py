#!/usr/bin/env python3
"""Add the language switcher div to all pages that are missing it."""
import pathlib, re

root = pathlib.Path('/home/harvey/nexuswebtools')

LANG_SWITCH = '''    <div class="lang-switch" style="margin-left:auto;display:flex;gap:0.4rem;">
      <a href="?lang=en" class="lang" title="English" onclick="localStorage.setItem('nwt-lang','en');">🇬🇧</a>
      <a href="?lang=nl" class="lang" title="Nederlands" onclick="localStorage.setItem('nwt-lang','nl');">🇳🇱</a>
      <a href="?lang=pt-BR" class="lang" title="Português (Brasil)" onclick="localStorage.setItem('nwt-lang','pt-BR');">🇧🇷</a>
      <a href="?lang=ja" class="lang" title="日本語" onclick="localStorage.setItem('nwt-lang','ja');">🇯🇵</a>
      <a href="?lang=sg" class="lang" title="English (Singapore)" onclick="localStorage.setItem('nwt-lang','sg');">🇸🇬</a>
    </div>
'''

count = 0
for html_path in root.rglob('*.html'):
    if 'scripts' in str(html_path):
        continue
    try:
        txt = html_path.read_text(encoding='utf-8')
    except:
        continue
    
    if 'lang-switch' in txt:
        continue  # already has it
    
    # Find the </nav> tag and insert lang-switch before it
    # Pattern: </nav> followed by newline and maybe other content
    if '<nav>' in txt or 'class="nav-ribbon"' in txt or '</nav>' in txt:
        # Try to find the closing </nav> of the main navigation
        # Most pages have <nav>...</nav> in the header
        # Insert lang-switch before the closing </nav>
        if '</nav>' in txt:
            # Replace the first </nav> with lang-switch + </nav>
            txt = txt.replace('</nav>', LANG_SWITCH + '</nav>', 1)
            html_path.write_text(txt, encoding='utf-8')
            count += 1
            print(f"Fixed: {html_path}")
        elif '<nav class="nav-ribbon">' in txt:
            # Self-closing or different structure
            txt = txt.replace('</nav>', LANG_SWITCH + '</nav>', 1)
            html_path.write_text(txt, encoding='utf-8')
            count += 1
            print(f"Fixed: {html_path}")

print(f"\nDone — {count} pages updated")
