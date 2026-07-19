#!/usr/bin/env python3
"""Fix language selector buttons across all HTML files — switch from directory paths to ?lang= query params."""
import pathlib, re

root = pathlib.Path('/home/harvey/nexuswebtools')

# Old pattern: <a href="/en/" class="lang" ...>🇬🇧</a>
# New pattern: <a href="?lang=en" class="lang" ...>🇬🇧</a>
LANG_MAP = {
    '/en/':   'en',
    '/nl/':   'nl',
    '/pt-BR/':'pt-BR',
    '/ja/':   'ja',
    '/sg/':   'sg',
}

old_block = re.compile(
    r'<a href="(/en/|/nl/|/pt-BR/|/ja/|/sg/)"\s+class="lang"\s+title="([^"]*)">([^<]*)</a>'
)

new_block = (
    '<a href="?lang={lang}" class="lang" title="{title}" '
    'onclick="localStorage.setItem(\'nwt-lang\',\'{lang}\');">{flag}</a>'
)

count = 0
for html_path in root.rglob('*.html'):
    try:
        txt = html_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f"Skip {html_path}: {e}")
        continue

    original = txt

    # Replace old href="/xx/" lang links with ?lang=xx onclick
    def repl(m):
        href = m.group(1)
        title = m.group(2)
        flag = m.group(3)
        lang_code = LANG_MAP.get(href, 'en')
        return new_block.format(lang=lang_code, title=title, flag=flag)

    txt = old_block.sub(repl, txt)

    # Also fix the add_i18n scripts' generated content if present inline
    # (the scripts themselves are separate files, not embedded)

    if txt != original:
        html_path.write_text(txt, encoding='utf-8')
        count += 1
        print(f"Fixed {html_path}")

print(f"\nDone — {count} files updated")
