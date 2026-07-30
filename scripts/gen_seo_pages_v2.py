#!/usr/bin/env python3
"""
Generate more SEO-optimized calculator/content pages for nexuswebtools.com.
Targeting high-search-volume keywords not yet covered.
"""
import pathlib, json, datetime

root = pathlib.Path('/home/harvey/nexuswebtools')

PAGES = [
    {
        'slug': 'income-tax',
        'dir': 'income-tax',
        'title': 'Income Tax Calculator — Estimate Your Tax Liability',
        'meta_desc': 'Free income tax calculator. Estimate your income tax liability for the 2025-26 financial year. Supports Australian marginal tax rates, HECS/HELP, and Medicare levy.',
        'h1': 'Income Tax Calculator',
        'lede': 'Estimate your income tax for the 2025-26 financial year. Enter your gross income to see your marginal tax rate, HECS/HELP repayments, Medicare levy, and net (after-tax) income.',
        'sections': [
            ('How Australian income tax works', 'Australia uses a progressive tax system, meaning the more you earn, the higher the percentage of tax you pay. Your income is divided into brackets, and each bracket is taxed at a different rate.\n\nFor the 2025-26 financial year (1 July 2025 to 30 June 2026), the tax brackets are:\n\n• $0 – $18,200: 0% (tax-free threshold)\n• $18,201 – $45,000: 16%\n• $45,001 – $135,000: 30%\n• $135,001 – $190,000: 37%\n• $190,001 and over: 45%\n\nIn addition to income tax, most taxpayers pay the 2% Medicare levy. High-income earners without private health insurance may also pay the Medicare levy surcharge (1%–1.5%).'),
            ('What is a marginal tax rate?', 'Your marginal tax rate is the rate applied to your next dollar of income. For example, if you earn $80,000, your marginal rate is 30%. This means any additional income (like a pay rise, bonus, or investment return) will be taxed at 30% until you cross into the next bracket.\n\nUnderstanding your marginal rate is crucial for financial decisions:\n\n• Salary sacrificing into superannuation saves tax at your marginal rate\n• Investment income (dividends, interest) is taxed at your marginal rate\n• Side hustle income is taxed on top of your existing income at your marginal rate'),
            ('HECS/HELP debt and tax', 'If you have a HECS-HELP student loan, the Australian Taxation Office (ATO) automatically deducts repayments from your income once you earn above the repayment threshold. For 2025-26, the threshold is $54,435.\n\nRepayment rates are:\n\n• $54,435 – $62,854: 1%\n• $62,855 – $66,820: 2%\n• $66,821 – $71,093: 2.5%\n• $71,094 – $77,691: 3%\n• ... increasing up to 10% for incomes over $162,852\n\nHECS/HELP repayments are calculated on your repayment income, which includes salary, reportable fringe benefits, and some investment income.'),
            ('How to reduce your tax legally', 'There are several legitimate strategies to reduce your tax bill:\n\n• Salary sacrifice to superannuation: Contribute up to $30,000 per year into super (taxed at 15% instead of your marginal rate).\n• Work-related deductions: Claim expenses directly related to earning your income (home office, uniforms, tools, education).\n• Investment property deductions: Negative gearing allows you to offset property losses against other income.\n• Charitable donations: Deductible gifts over $2 to registered charities reduce your taxable income.\n• Private health insurance: Avoid the Medicare levy surcharge if your income is above $93,000 (singles) or $186,000 (couples).'),
        ],
        'faqs': [
            ('What is the tax-free threshold in Australia?', 'The tax-free threshold is $18,200. If your total income for the year is $18,200 or less, you pay no income tax. Most Australian residents are entitled to this threshold.'),
            ('What is the Medicare levy?', 'The Medicare levy is 2% of your taxable income. Most taxpayers pay it. Low-income earners may be exempt or pay a reduced rate.'),
            ('How is HECS/HELP repaid?', 'HECS/HELP repayments are automatically deducted by the ATO from your salary once your income exceeds $54,435 (2025-26). The percentage increases with income, from 1% up to 10%.'),
            ('What is negative gearing?', 'Negative gearing occurs when the costs of owning an investment property exceed the rental income. The loss can be deducted from your other income, reducing your overall tax bill.'),
            ('When is tax due in Australia?', 'For most employees, tax is withheld from each paycheck (PAYG withholding). If you lodge your own return, it is due by 31 October each year. Tax agents get extensions into the following year.'),
        ],
        'related': [
            ('/compound-interest/superannuation/', 'Superannuation Calculator'),
            ('/compound-interest/savings/', 'Savings Calculator'),
            ('/gst/', 'GST Calculator'),
            ('/percentage/', 'Percentage Calculator'),
        ],
    },
    {
        'slug': 'capital-gains-tax',
        'dir': 'capital-gains-tax',
        'title': 'Capital Gains Tax (CGT) Calculator — Calculate CGT on Investments',
        'meta_desc': 'Free CGT calculator. Calculate capital gains tax on shares, property, and crypto. Includes the 50% CGT discount for assets held over 12 months.',
        'h1': 'Capital Gains Tax (CGT) Calculator',
        'lede': 'Calculate the capital gains tax payable when you sell shares, property, cryptocurrency, or other investments. Includes the 50% CGT discount for assets held longer than 12 months.',
        'sections': [
            ('What is capital gains tax?', 'Capital gains tax (CGT) is the tax you pay on the profit made from selling an investment asset. In Australia, CGT is not a separate tax — it forms part of your income tax. The capital gain is added to your regular income and taxed at your marginal rate.\n\nA capital gain occurs when you sell an asset for more than its cost base (purchase price plus associated costs like stamp duty, legal fees, and improvements). A capital loss occurs when you sell for less, and can only offset capital gains — not ordinary income.'),
            ('The 50% CGT discount', 'If you hold an investment asset for more than 12 months before selling, you may be eligible for a 50% CGT discount. This means only half of your capital gain is included in your assessable income.\n\nFor example, if you make a $20,000 capital gain on shares held for 2 years:\n\n• Discounted gain: $20,000 × 50% = $10,000\n• This $10,000 is added to your taxable income\n• Tax payable depends on your marginal rate\n\nThe discount is available to individuals and trusts, but not companies. Assets must be held for more than 12 months — the date of acquisition and disposal both matter.'),
            ('CGT on different asset types', 'Different assets have different CGT rules:\n\n• **Shares**: CGT applies when you sell shares. The cost base includes purchase price plus brokerage. If you sell multiple parcels, you can choose which identification method to use (FIFO, LIFO, or specific parcel).\n• **Property**: CGT applies to investment properties (not your main residence, which is generally exempt). The cost base includes purchase price, stamp duty, legal fees, and certain capital improvements (but not repairs).\n• **Cryptocurrency**: Crypto is treated as a CGT asset. Converting crypto to AUD, trading one crypto for another, or using crypto to purchase goods all trigger CGT events.\n• **Collectables**: Items like artwork, jewellery, and antiques over $500 are subject to CGT.'),
            ('How to calculate CGT', 'The CGT calculation follows these steps:\n\n1. Determine the capital gain: Sale price minus cost base (purchase price + incidental costs + capital improvements)\n2. Apply the 50% discount if held > 12 months\n3. Add the discounted gain to your assessable income\n4. Apply any available capital losses (from current or prior years)\n5. Calculate tax at your marginal rate\n\nFor example:\n• Bought shares for $10,000 (including brokerage)\n• Sold 18 months later for $25,000 (minus $500 brokerage)\n• Capital gain: $25,000 – $500 – $10,000 = $14,500\n• After 50% discount: $14,500 × 50% = $7,250\n• Tax at 30% marginal rate: $7,250 × 30% = $2,175'),
        ],
        'faqs': [
            ('What is the 50% CGT discount?', 'If you hold an asset for more than 12 months, only 50% of the capital gain is included in your assessable income. This effectively halves the tax you pay on the gain.'),
            ('Is my main residence subject to CGT?', 'Generally no. Your main residence is exempt from CGT under the main residence exemption. However, if you rent it out or use it for business, partial CGT may apply.'),
            ('Can I offset capital losses against income?', 'No. Capital losses can only be offset against capital gains, not ordinary income. Unused losses carry forward to future years indefinitely.'),
            ('How is crypto taxed in Australia?', 'Cryptocurrency is subject to CGT. Selling, trading, or using crypto to buy goods triggers a CGT event. The 50% discount applies if held > 12 months.'),
            ('Do I pay CGT on inherited property?', 'No CGT is payable at the time of inheritance. However, when you later sell the inherited property, CGT applies (unless it was the deceased\'s main residence and sold within 2 years).'),
        ],
        'related': [
            ('/income-tax/', 'Income Tax Calculator'),
            ('/roi/', 'ROI Calculator'),
            ('/compound-interest/investments/', 'Investments Calculator'),
            ('/percentage/', 'Percentage Calculator'),
        ],
    },
    {
        'slug': 'stamp-duty',
        'dir': 'stamp-duty',
        'title': 'Stamp Duty Calculator — Calculate Property Transfer Duty',
        'meta_desc': 'Free stamp duty calculator. Calculate property transfer stamp duty for all Australian states and territories. Includes concessions for first home buyers and owner-occupiers.',
        'h1': 'Stamp Duty Calculator',
        'lede': 'Calculate the stamp duty payable when buying property in any Australian state or territory. Includes first home buyer concessions and principal place of residence discounts.',
        'sections': [
            ('What is stamp duty?', 'Stamp duty (also called transfer duty or land transfer duty) is a state government tax payable when you purchase property. The amount varies significantly between states and territories, and depends on the property value, whether you are a first home buyer, and whether the property will be your principal place of residence.\n\nStamp duty is one of the largest upfront costs when buying property — often tens of thousands of dollars on top of the purchase price. It must be paid within a set period (usually 30-90 days) of settlement.'),
            ('Stamp duty rates by state', 'Each Australian state and territory has its own stamp duty schedule:\n\n• **New South Wales**: Progressive rates from 1.25% to 7.25%. First home buyers may be exempt up to $800,000 (with concessional rates up to $1,000,000).\n• **Victoria**: Progressive rates from 1.4% to 6.5%. First home buyers exempt up to $600,000 (concessional up to $750,000).\n• **Queensland**: $1.50 per $100 (or part) up to $540,000, then progressive. First home buyers exempt up to $700,000.\n• **Western Australia**: Progressive rates from 1.90% to 5.15%. First home buyers exempt up to $450,000.\n• **South Australia**: Progressive rates from 1.0% to 5.5%.\n• **Tasmania**: Progressive rates from 1.75% to 4.5%.\n• **ACT**: Progressive rates from 0.60% to 6.40%.\n• **Northern Territory**: Based on a formula linked to property value bands.'),
            ('First home buyer concessions', 'Most states offer stamp duty concessions or exemptions for first home buyers:\n\n• **NSW**: Full exemption up to $800,000, concessional rates up to $1,000,000\n• **VIC**: Full exemption up to $600,000, concessional rates up to $750,000\n• **QLD**: Full exemption up to $700,000\n• **WA**: Full exemption up to $450,000, concessional rates up to $600,000\n\nEligibility typically requires you to be an Australian citizen or permanent resident, over 18, and not have previously owned property in Australia. You must also intend to live in the property as your principal place of residence.'),
        ],
        'faqs': [
            ('How much is stamp duty on a $500,000 house in NSW?', 'In NSW, stamp duty on a $500,000 property is approximately $17,990 for a non-first-home-buyer. First home buyers may be fully exempt.'),
            ('When do I have to pay stamp duty?', 'Stamp duty is typically payable within 30 days of property settlement. Your conveyancer or solicitor will usually arrange payment as part of the settlement process.'),
            ('Do first home buyers pay stamp duty?', 'It depends on the state and property value. Most states offer full exemptions up to a certain threshold (e.g., $800,000 in NSW, $600,000 in Victoria) and concessional rates above that.'),
            ('Is stamp duty tax deductible?', 'No. Stamp duty on purchasing property is not tax deductible. It forms part of the cost base for CGT purposes when you sell the property.'),
            ('Does stamp duty apply to off-the-plan purchases?', 'Yes, but in some states (like Victoria) off-the-plan purchases receive a concession — stamp duty is calculated only on the land value plus completed construction value, not the total purchase price.'),
        ],
        'related': [
            ('/mortgage/', 'Mortgage Calculator'),
            ('/compound-interest/home-loan/', 'Home Loan Calculator'),
            ('/income-tax/', 'Income Tax Calculator'),
            ('/capital-gains-tax/', 'CGT Calculator'),
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
<link rel="canonical" href="https://nexuswebtools.com/{slug}/">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/nav.css">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Nexus Web Tools">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{meta_desc}">
<meta property="og:url" content="https://nexuswebtools.com/{slug}/">
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
    <div class="brand"><a href="/" style="text-decoration:none;color:inherit"><span data-i18n="brand">🧰 Nexus Web Tools</span></a></div>
    <nav>
      <a href="/"><span data-i18n="navHome">Home</span></a>
      <a href="/#tools"><span data-i18n="navTools">Tools</span></a>
      <a href="#faq"><span data-i18n="navFAQ">FAQ</span></a>
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
  <p><a href="/">All tools</a> · <a href="/compound-interest/">Compound Interest</a> · <a href="/mortgage/">Mortgage</a> · <a href="/income-tax/">Income Tax</a> · <a href="/capital-gains-tax/">CGT Calculator</a> · <a href="/stamp-duty/">Stamp Duty</a> · <a href="/unit-converter/">Unit Converter</a></p>
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
    
    html += f'<main>\n'
    html += f'  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>{page["h1"]}</span></nav>\n'
    html += f'  <div class="hero">\n    <h1>{page["h1"]}</h1>\n    <p class="lede">{page["lede"]}</p>\n  </div>\n'
    html += f'  <p class="disclaimer"><strong>Disclaimer:</strong> This calculator is provided for informational and educational purposes only. It does not constitute financial, tax, or professional advice.</p>\n'
    
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
    
    html += f'  <section id="faq">\n    <h2>Frequently Asked Questions</h2>\n'
    for q, a in page['faqs']:
        html += f'    <h3>{q}</h3>\n    <p>{a}</p>\n'
    html += f'  </section>\n'
    
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
    print(f"  Built: /{slug}/ ({len(html)} bytes)")

for page in PAGES:
    build_page(page)
print(f"\nDone — {len(PAGES)} pages built")
