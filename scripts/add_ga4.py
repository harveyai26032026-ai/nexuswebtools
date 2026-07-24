#!/usr/bin/env python3
"""Inject Google Analytics (GA4) tag into all HTML pages."""
import pathlib

root = pathlib.Path('/home/harvey/nexuswebtools')
GA_TAG = '''<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XY5PSBLW98"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XY5PSBLW98', { 'anonymize_ip': true });
</script>
'''

count = 0
for html_path in root.rglob('*.html'):
    if 'scripts' in str(html_path):
        continue
    try:
        txt = html_path.read_text(encoding='utf-8')
    except:
        continue
    
    if 'G-XY5PSBLW98' in txt:
        continue  # already has it
    
    if '</head>' in txt:
        txt = txt.replace('</head>', GA_TAG + '</head>')
    elif '</body>' in txt:
        txt = txt.replace('</body>', GA_TAG + '</body>')
    else:
        continue
    
    html_path.write_text(txt, encoding='utf-8')
    count += 1

print(f"Done — GA4 tag added to {count} pages")
