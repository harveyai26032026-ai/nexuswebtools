#!/usr/bin/env python3
"""
Generate SEO-optimized calculator/content pages for nexuswebtools.com.
Each page includes: meta tags, JSON-LD schema, H1/H2/H3 structure,
FAQ section, related links, Infolinks ads, GA4, and internal linking.
"""
import pathlib, json, datetime

root = pathlib.Path('/home/harvey/nexuswebtools')

# Pages to generate — each is a high-search-volume keyword
PAGES = [
    {
        'slug': 'percentage',
        'dir': 'percentage',
        'title': 'Percentage Calculator — Free Online % Calculator',
        'meta_desc': 'Free percentage calculator. Calculate percentage of a number, percentage change, increase/decrease, and more. Instant results, no sign-up.',
        'h1': 'Percentage Calculator',
        'lede': 'Calculate percentages instantly — percentage of a number, percentage change, increase or decrease, and reverse percentages. Free, mobile-friendly, no sign-up.',
        'category': 'Math & Finance',
        'sections': [
            ('What is a percentage?', 'A percentage is a number expressed as a fraction of 100. The word comes from the Latin "per centum", meaning "by the hundred". Percentages are used everywhere — from discounts and interest rates to test scores and statistics — because they make it easy to compare proportions on a common scale.\n\nThe symbol for percentage is %. When you see "25%", it means 25 out of 100, or 25/100, or 0.25 in decimal form. To convert a decimal to a percentage, multiply by 100. To convert a percentage to a decimal, divide by 100.'),
            ('How to calculate a percentage of a number', 'To find a percentage of a number, multiply the number by the percentage divided by 100. For example, to find 15% of 200:\n\n15 ÷ 100 × 200 = 0.15 × 200 = 30\n\nSo 15% of 200 is 30. This is useful for calculating discounts, tips, tax, and commission.'),
            ('How to calculate percentage change', 'Percentage change measures how much a value has increased or decreased relative to its original value. The formula is:\n\nPercentage change = (New value − Original value) ÷ Original value × 100\n\nIf the result is positive, it\'s an increase. If negative, it\'s a decrease. For example, if a stock rises from $50 to $65, the percentage change is (65 − 50) ÷ 50 × 100 = 30% increase.'),
            ('Common percentage calculations', 'Percentages are used in many everyday situations:\n\n• **Discounts**: A $80 item at 25% off costs $80 × (1 − 0.25) = $60.\n• **Tax**: 10% GST on a $150 purchase adds $15.\n• **Tips**: An 18% tip on a $45 meal is $8.10.\n• **Interest**: 5% annual interest on $1,000 earns $50 per year.\n• **Grades**: Scoring 42 out of 50 is 42 ÷ 50 × 100 = 84%.'),
        ],
        'faqs': [
            ('How do I calculate percentage of a number?', 'Multiply the number by the percentage and divide by 100. For example, 20% of 150 = 150 × 20 ÷ 100 = 30.'),
            ('How do I calculate percentage increase?', 'Use the formula: ((New − Original) ÷ Original) × 100. If a price goes from $40 to $50, the increase is ((50−40)÷40)×100 = 25%.'),
            ('How do I calculate percentage decrease?', 'Use the same formula as increase. If a price drops from $50 to $40, the decrease is ((40−50)÷50)×100 = −20%, or a 20% decrease.'),
            ('What is the difference between percentage and percentile?', 'A percentage is a fraction of 100. A percentile is the value below which a certain percentage of data falls. Scoring in the 90th percentile means you scored better than 90% of people.'),
            ('How do I convert a decimal to a percentage?', 'Multiply by 100. For example, 0.75 × 100 = 75%.'),
        ],
        'related': [
            ('/compound-interest/', 'Compound Interest Calculator'),
            ('/mortgage/', 'Mortgage Calculator'),
            ('/compound-interest/savings/', 'Savings Calculator'),
            ('/unit-converter/', 'Unit Converter'),
        ],
    },
    {
        'slug': 'gst',
        'dir': 'gst',
        'title': 'GST Calculator — Calculate GST (Goods and Services Tax)',
        'meta_desc': 'Free GST calculator. Add or remove GST from any amount. Supports Australian (10%), New Zealand (15%), and custom GST rates. Instant results.',
        'h1': 'GST Calculator',
        'lede': 'Add or remove GST from any amount instantly. Supports 10% Australian GST, 15% NZ GST, and custom rates. Calculate tax-inclusive and tax-exclusive prices.',
        'category': 'Finance',
        'sections': [
            ('What is GST?', 'Goods and Services Tax (GST) is a value-added tax levied on most goods and services sold for domestic consumption. It is used in many countries including Australia (10%), New Zealand (15%), Singapore (9%), Canada (5%), and India (18% for most goods).\n\nGST is typically included in the price displayed to consumers. Businesses collect GST on behalf of the government and can claim back GST they pay on business expenses.'),
            ('How to calculate GST', 'To add GST to a price:\n\nGST amount = Price × (GST rate ÷ 100)\n\nTotal (GST-inclusive) = Price + GST amount\n\nFor example, with 10% GST on a $100 item:\nGST = $100 × 0.10 = $10\nTotal = $110\n\nTo remove GST from a GST-inclusive price:\n\nPrice (excl GST) = Total ÷ (1 + GST rate/100)\nGST amount = Total − Price (excl GST)\n\nFor example, removing 10% GST from $220:\nPrice excl GST = $220 ÷ 1.10 = $200\nGST = $220 − $200 = $20'),
            ('GST rates by country', 'Different countries have different GST rates:\n\n• **Australia**: 10% (since July 2000)\n• **New Zealand**: 15% (raised from 12.5% in 2010)\n• **Singapore**: 9% (raised from 8% in 2024)\n• **Canada**: 5% federal, plus provincial rates\n• **India**: 5%, 12%, 18%, or 28% depending on goods\n• **United Kingdom**: 20% VAT (similar to GST)\n\nSome items are GST-free, including basic food, medical services, and educational services in Australia.'),
        ],
        'faqs': [
            ('How do I calculate 10% GST?', 'Multiply the price by 0.10 to get the GST amount, or by 1.10 to get the total including GST. For example, $100 + 10% GST = $110.'),
            ('How do I remove GST from a total?', 'Divide the GST-inclusive total by 1.10 (for 10% GST). For example, $220 ÷ 1.10 = $200 (the GST-free price). The GST is $20.'),
            ('What items are GST-free in Australia?', 'Basic food (bread, milk, fruit, vegetables), medical services, educational courses, childcare, and some exports are GST-free.'),
            ('What is the difference between GST and VAT?', 'GST and VAT are essentially the same — both are consumption taxes collected at each stage of production. The terms are used interchangeably, though different countries use different names.'),
            ('Do I need to charge GST?', 'In Australia, you must register for GST if your annual turnover is $75,000 or more. Once registered, you charge GST on taxable sales and can claim GST credits on business purchases.'),
        ],
        'related': [
            ('/compound-interest/', 'Compound Interest Calculator'),
            ('/mortgage/', 'Mortgage Calculator'),
            ('/percentage/', 'Percentage Calculator'),
            ('/unit-converter/', 'Unit Converter'),
        ],
    },
    {
        'slug': 'roi',
        'dir': 'roi',
        'title': 'ROI Calculator — Return on Investment Calculator',
        'meta_desc': 'Free ROI calculator. Calculate return on investment, annualized ROI, and compare investment performance. Includes formula, examples, and FAQ.',
        'h1': 'ROI Calculator',
        'lede': 'Calculate the return on investment (ROI) for any investment. Enter your initial cost and final value to see total ROI, annualized return, and profit.',
        'category': 'Finance',
        'sections': [
            ('What is ROI?', 'Return on Investment (ROI) is a measure of the profitability of an investment. It expresses the gain or loss as a percentage of the original cost, making it easy to compare different investments.\n\nROI is one of the most widely used metrics in finance because it is simple to calculate and understand. However, it does have limitations — particularly that it doesn\'t account for the time held, unless you use annualized ROI.'),
            ('How to calculate ROI', 'The basic ROI formula is:\n\nROI = (Final Value − Initial Cost) ÷ Initial Cost × 100\n\nFor example, if you invest $1,000 and sell for $1,500:\nROI = ($1,500 − $1,000) ÷ $1,000 × 100 = 50%\n\nTo calculate annualized ROI:\n\nAnnualized ROI = ((Final Value ÷ Initial Cost) ^ (1 ÷ years)) − 1\n\nFor example, if the $1,000 investment grew to $1,500 over 3 years:\nAnnualized ROI = ((1,500 ÷ 1,000) ^ (1/3)) − 1 = 14.5% per year'),
            ('ROI vs other metrics', 'While ROI is useful, it has limitations. Other metrics to consider:\n\n• **IRR (Internal Rate of Return)**: Accounts for the timing of cash flows, not just start and end values.\n• **NPV (Net Present Value)**: Discounts future cash flows to present value using a discount rate.\n• **CAGR (Compound Annual Growth Rate)**: Similar to annualized ROI but assumes steady growth.\n• **Payback Period**: How long it takes to recover the initial investment.\n\nFor real estate, stocks, or business investments with multiple cash flows, IRR or NPV may be more appropriate than simple ROI.'),
        ],
        'faqs': [
            ('What is a good ROI?', 'A "good" ROI depends on the investment type and risk. Stock market average is ~7-10% per year. Real estate typically targets 8-12%. A business investment might need 15-25% to justify the risk.'),
            ('How is ROI different from profit?', 'Profit is the dollar amount gained (e.g., $500). ROI is the percentage return (e.g., 50%). ROI allows comparison between investments of different sizes.'),
            ('Does ROI account for time?', 'Basic ROI does not. A 50% return over 1 year is very different from 50% over 10 years. Use annualized ROI to compare investments held for different periods.'),
            ('Can ROI be negative?', 'Yes. If the final value is less than the initial cost, ROI is negative. For example, investing $1,000 and selling for $800 gives an ROI of -20%.'),
            ('How do I calculate ROI with multiple investments?', 'Use the total of all investments as the initial cost, and the current total value as the final value. Or use IRR for more accurate results with timed cash flows.'),
        ],
        'related': [
            ('/compound-interest/', 'Compound Interest Calculator'),
            ('/compound-interest/investments/', 'Investments Calculator'),
            ('/compound-interest/retirement/', 'Retirement Calculator'),
            ('/percentage/', 'Percentage Calculator'),
        ],
    },
]

HEADER = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{meta_desc}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="googlebot" content="index, follow">
<meta name="author" content="Nexus Web Tools">
<meta name="theme-color" content="#3b5bdb">
<link rel="canonical" href="https://nexuswebtools.com/{slug}/">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/favicon.webp" type="image/webp">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/nav.css">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Nexus Web Tools">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{meta_desc}">
<meta property="og:url" content="https://nexuswebtools.com/{slug}/">
<meta property="og:image" content="https://nexuswebtools.com/og.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{meta_desc}">
<link rel="alternate" hreflang="en" href="https://nexuswebtools.com/?lang=en" />
<link rel="alternate" hreflang="nl" href="https://nexuswebtools.com/?lang=nl" />
<link rel="alternate" hreflang="pt-BR" href="https://nexuswebtools.com/?lang=pt-BR" />
<link rel="alternate" hreflang="ja" href="https://nexuswebtools.com/?lang=ja" />
<link rel="alternate" hreflang="sg" href="https://nexuswebtools.com/?lang=sg" />
<link rel="alternate" hreflang="x-default" href="https://nexuswebtools.com/" />
<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XY5PSBLW98"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-XY5PSBLW98', {{ 'anonymize_ip': true }});
</script>
</head>
<body>
<header class="ribbon">
  <div class="ribbon-inner">
    <button class="hamburger" aria-label="Open menu">
      <svg class="icon-open" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      <svg class="icon-close" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="brand"><a href="/" style="text-decoration:none;color:inherit">🧰 Nexus Web Tools</a></div>
    <nav>
      <a href="/">Home</a>
      <a href="/#tools">Tools</a>
      <a href="#faq">FAQ</a>
    </nav>
    <div class="lang-switch" style="margin-left:auto;display:flex;gap:0.4rem;">
      <a href="?lang=en" class="lang" title="English" onclick="localStorage.setItem('nwt-lang','en');">🇬🇧</a>
      <a href="?lang=nl" class="lang" title="Nederlands" onclick="localStorage.setItem('nwt-lang','nl');">🇳🇱</a>
      <a href="?lang=pt-BR" class="lang" title="Português (Brasil)" onclick="localStorage.setItem('nwt-lang','pt-BR');">🇧🇷</a>
      <a href="?lang=ja" class="lang" title="日本語" onclick="localStorage.setItem('nwt-lang','ja');">🇯🇵</a>
      <a href="?lang=sg" class="lang" title="English (Singapore)" onclick="localStorage.setItem('nwt-lang','sg');">🇸🇬</a>
    </div>
    <div class="ribbon-search">
      <button class="ribbon-search-btn" aria-label="Search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
      <input type="text" placeholder="Search tools…" autocomplete="off">
    </div>
  </div>
  <div class="scroll-bar"><div class="scroll-bar-fill"></div></div>
</header>
'''

FOOTER = '''
<footer>
  <p><strong>{tool_name}</strong> — free online calculator from Nexus Web Tools.</p>
  <p><a href="/">All tools</a> · <a href="/compound-interest/">Compound Interest</a> · <a href="/mortgage/">Mortgage</a> · <a href="/s-curve/">S‑Curve Model</a> · <a href="/unit-converter/">Unit Converter</a> · <a href="/percentage/">Percentage Calculator</a></p>
  <p>Estimates are for general guidance only and are not financial advice. Consult a licensed professional for important decisions.</p>
</footer>
<script src="/scroll-bar.js" defer></script>
<script src="/nav.js" defer></script>
<script src="/lang-loader.js" defer></script>
<script type="text/javascript">var infolinks_pid = 3446367;var infolinks_wsid = 0;</script>
<script type="text/javascript" src="http://resources.infolinks.com/js/infolinks_main.js"></script>
</body>
</html>
'''

def build_page(page):
    slug = page['slug']
    page_dir = root / page['dir']
    page_dir.mkdir(parents=True, exist_ok=True)
    
    html = HEADER.format(
        title=page['title'],
        meta_desc=page['meta_desc'],
        slug=slug,
    )
    
    # Main content
    html += f'<main>\n'
    html += f'  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>{page["h1"]}</span></nav>\n'
    html += f'  <div class="hero">\n    <h1>{page["h1"]}</h1>\n    <p class="lede">{page["lede"]}</p>\n  </div>\n'
    html += f'  <p class="disclaimer"><strong>Disclaimer:</strong> This calculator is provided for informational and educational purposes only. It does not constitute financial, tax, or professional advice.</p>\n'
    
    # Sections
    for h2, body in page['sections']:
        html += f'  <section>\n    <h2>{h2}</h2>\n'
        for para in body.split('\n\n'):
            if para.strip().startswith('•'):
                html += f'    <ul>\n'
                for line in para.split('\n'):
                    if line.strip():
                        html += f'      <li>{line.strip().lstrip("• ")}</li>\n'
                html += f'    </ul>\n'
            else:
                html += f'    <p>{para.strip()}</p>\n'
        html += f'  </section>\n'
    
    # FAQ
    html += f'  <section id="faq">\n    <h2>Frequently Asked Questions</h2>\n'
    for q, a in page['faqs']:
        html += f'    <h3>{q}</h3>\n    <p>{a}</p>\n'
    html += f'  </section>\n'
    
    # Related links
    html += f'  <section class="related-tools">\n    <h2>Related Calculators</h2>\n    <div class="related-links">\n'
    for href, label in page['related']:
        html += f'      <a href="{href}">{label}</a>\n'
    html += f'    </div>\n  </section>\n'
    html += f'</main>\n'
    
    # JSON-LD Schema
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebApplication",
                "name": page['h1'],
                "url": f"https://nexuswebtools.com/{slug}/",
                "applicationCategory": "FinanceApplication",
                "operatingSystem": "All",
                "browserRequirements": "Requires JavaScript",
                "description": page['meta_desc'],
                "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
                    for q, a in page['faqs']
                ]
            }
        ]
    }
    html = html.replace('</head>', f'<script type="application/ld+json">\n{json.dumps(schema, indent=2)}\n</script>\n</head>')
    
    html += FOOTER.format(tool_name=page['h1'])
    
    (page_dir / 'index.html').write_text(html, encoding='utf-8')
    print(f"  Built: /{slug}/ ({len(html)} bytes, ~{len(html.split())} words)")

print(f"\nBuilding {len(PAGES)} new SEO pages...")
for page in PAGES:
    build_page(page)
print("\nDone!")
