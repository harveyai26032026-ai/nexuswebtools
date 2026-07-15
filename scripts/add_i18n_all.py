import pathlib, re, sys
root = pathlib.Path('/home/harvey/nexuswebtools')
# HTML snippets
hreflang_block = '''
<link rel="alternate" hreflang="en" href="https://nexuswebtools.com/en/" />
<link rel="alternate" hreflang="nl" href="https://nexuswebtools.com/nl/" />
<link rel="alternate" hreflang="pt-BR" href="https://nexuswebtools.com/pt-BR/" />
<link rel="alternate" hreflang="ja" href="https://nexuswebtools.com/ja/" />
<link rel="alternate" hreflang="sg" href="https://nexuswebtools.com/sg/" />
<link rel="alternate" hreflang="x-default" href="https://nexuswebtools.com/" />
'''
lang_selector = '''
    <!-- Language selector -->
    <div class="lang-switch" style="margin-left:auto;display:flex;gap:0.4rem;">
      <a href="/en/" class="lang" title="English">🇬🇧</a>
      <a href="/nl/" class="lang" title="Nederlands">🇳🇱</a>
      <a href="/pt-BR/" class="lang" title="Português (Brasil)">🇧🇷</a>
      <a href="/ja/" class="lang" title="日本語">🇯🇵</a>
      <a href="/sg/" class="lang" title="English (Singapore)">🇸🇬</a>
    </div>
'''
loader_script = '<script src="/lang-loader.js" defer></script>'

for html_path in root.rglob('*.html'):
    try:
        txt = html_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f"Failed to read {html_path}: {e}")
        continue
    original = txt
    # Insert hreflang before </head>
    if '</head>' in txt and 'hreflang' not in txt:
        txt = txt.replace('</head>', hreflang_block + '\n</head>')
    # Insert language selector after </nav>
    if '</nav>' in txt and '<div class="lang-switch"' not in txt:
        txt = txt.replace('</nav>', '</nav>' + lang_selector)
    # Insert loader before </body>
    if '</body>' in txt and loader_script not in txt:
        txt = txt.replace('</body>', '\n' + loader_script + '\n</body>')
    if txt != original:
        html_path.write_text(txt, encoding='utf-8')
        print(f"Updated {html_path}")
print('All done')
