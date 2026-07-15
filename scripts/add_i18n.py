import pathlib, re, sys
root = pathlib.Path('/home/harvey/nexuswebtools')
lang_selector = '''
    <!-- Language selector -->
    <div class="lang-switch" style="margin-left:auto;display:flex;gap:0.4rem;">
      <a href="/en/" class="lang" title="English">\ud83c\uddec\ud83c\udde7</a>
      <a href="/nl/" class="lang" title="Nederlands">\ud83c\uddf3\ud83c\uddf1</a>
      <a href="/pt-BR/" class="lang" title="Portugu\u00eas (Brasil)">\ud83c\udde7\ud83c\uddf7</a>
      <a href="/ja/" class="lang" title="\u65e5\u672c\u8a9e">\ud83c\uddef\ud83c\uddf5</a>
      <a href="/sg/" class="lang" title="English (Singapore)">\ud83c\uddf8\ud83c\uddec</a>
    </div>'''
loader_script = '<script src="/lang-loader.js" defer></script>'
hreflang_block = '''
<link rel="alternate" hreflang="en" href="https://nexuswebtools.com/en/" />
<link rel="alternate" hreflang="nl" href="https://nexuswebtools.com/nl/" />
<link rel="alternate" hreflang="pt-BR" href="https://nexuswebtools.com/pt-BR/" />
<link rel="alternate" hreflang="ja" href="https://nexuswebtools.com/ja/" />
<link rel="alternate" hreflang="sg" href="https://nexuswebtools.com/sg/" />
<link rel="alternate" hreflang="x-default" href="https://nexuswebtools.com/" />
'''
for html_path in root.rglob('*.html'):
    try:
        txt = html_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f"Failed to read {html_path}: {e}")
        continue
    original = txt
    # Insert hreflang block before </head>
    if '</head>' in txt and 'hreflang' not in txt:
        txt = txt.replace('</head>', hreflang_block + '\n</head>')
    # Insert language selector after </nav> if nav exists
    if '</nav>' in txt and '<div class="lang-switch"' not in txt:
        txt = txt.replace('</nav>', '</nav>' + lang_selector)
    # Insert loader script before </body>
    if '</body>' in txt and loader_script not in txt:
        txt = txt.replace('</body>', '\n' + loader_script + '\n</body>')
    if txt != original:
        html_path.write_text(txt, encoding='utf-8')
        print(f"Updated {html_path}")
print('All done')
