#!/usr/bin/env python3
"""Add contextual affiliate link sections to compound interest sub-calculators."""
import pathlib, re

root = pathlib.Path('/home/harvey/nexuswebtools/compound-interest')

# Map each sub-calculator to relevant affiliate offers
AFFILIATE_MAP = {
    'savings': ('Compare High-Yield Savings Accounts',
        'A 1% higher rate on $10,000 adds over $3,000 in interest over 20 years. Compare today\'s top offers:',
        [
            ('Bankrate — Best Savings Rates', 'https://www.bankrate.com/banking/savings/'),
            ('NerdWallet — High-Yield Savings', 'https://www.nerdwallet.com/best/banking/high-yield-savings'),
        ]),
    'retirement': ('Compare Retirement Accounts',
        'The right retirement account can save thousands in taxes. Compare IRAs, 401(k)s and pension options:',
        [
            ('NerdWallet — Best Retirement Accounts', 'https://www.nerdwallet.com/investing/retirement'),
            ('Bankrate — IRA Guide', 'https://www.bankrate.com/retirement/ira-guide/'),
        ]),
    'investments': ('Compare Investment Platforms',
        'Lower fees mean more of your money compounds. Compare the best investment platforms:',
        [
            ('NerdWallet — Best Brokers', 'https://www.nerdwallet.com/investing/best-brokers'),
            ('Bankrate — Investment Accounts', 'https://www.bankrate.com/investing/'),
        ]),
    'mortgage': ('Compare Mortgage Rates',
        'A 0.25% rate difference saves thousands over your loan. Compare today\'s rates:',
        [
            ('Bankrate — Mortgage Rates', 'https://www.bankrate.com/mortgages/'),
            ('NerdWallet — Mortgage Rates', 'https://www.nerdwallet.com/mortgages/mortgage-rates'),
        ]),
    'home-loan': ('Compare Home Loan Rates',
        'Find the best home loan for your needs — compare rates from multiple lenders:',
        [
            ('Bankrate — Home Loans', 'https://www.bankrate.com/mortgages/'),
            ('Compare the Market — Home Loans', 'https://www.comparethemarket.com/home-loans/'),
        ]),
    'car-loan': ('Compare Car Loan Rates',
        'A lower car loan rate can save hundreds. Compare today\'s auto loan offers:',
        [
            ('Bankrate — Auto Loans', 'https://www.bankrate.com/auto-loans/'),
            ('NerdWallet — Auto Loans', 'https://www.nerdwallet.com/loans/auto-loans'),
        ]),
    'credit-card': ('Compare Credit Cards',
        'Find the right credit card — compare rewards, low rates and balance transfer offers:',
        [
            ('NerdWallet — Best Credit Cards', 'https://www.nerdwallet.com/credit-cards'),
            ('Bankrate — Credit Cards', 'https://www.bankrate.com/credit-cards/'),
        ]),
    'student-loan': ('Compare Student Loan Refinance Rates',
        'Refinancing at a lower rate can save thousands. Compare student loan refinance offers:',
        [
            ('NerdWallet — Student Loan Refinance', 'https://www.nerdwallet.com/loans/student-loans/refinance'),
            ('Bankrate — Student Loans', 'https://www.bankrate.com/loans/student-loans/'),
        ]),
    'personal-loan': ('Compare Personal Loan Rates',
        'Get pre-qualified for a personal loan without affecting your credit score:',
        [
            ('NerdWallet — Personal Loans', 'https://www.nerdwallet.com/loans/personal-loans'),
            ('Bankrate — Personal Loans', 'https://www.bankrate.com/loans/personal-loans/'),
        ]),
    'crypto': ('Compare Crypto Exchanges',
        'Lower trading fees mean more of your investment compounds. Compare top exchanges:',
        [
            ('NerdWallet — Best Crypto Exchanges', 'https://www.nerdwallet.com/investing/cryptocurrency/best-crypto-exchanges'),
        ]),
    'dividend': ('Compare Dividend Investment Platforms',
        'Reinvesting dividends supercharges compound growth. Compare the best platforms:',
        [
            ('NerdWallet — Best Brokers', 'https://www.nerdwallet.com/investing/best-brokers'),
        ]),
}

count = 0
for subdir, (title, desc, links) in AFFILIATE_MAP.items():
    html_path = root / subdir / 'index.html'
    if not html_path.exists():
        continue
    
    txt = html_path.read_text(encoding='utf-8')
    if 'nofollow sponsored' in txt:
        print(f"Skip (already has affiliate): {subdir}")
        continue
    
    # Build affiliate section HTML
    link_html = '\n      '.join(
        f'<a href="{url}" target="_blank" rel="noopener nofollow sponsored">{name}</a>'
        for name, url in links
    )
    
    section = f'''
  <section class="related-tools">
    <h2>{title}</h2>
    <p>{desc}</p>
    <div class="related-links">
      {link_html}
    </div>
  </section>
'''
    
    # Insert before </main>
    if '</main>' in txt:
        txt = txt.replace('</main>', section + '</main>')
        html_path.write_text(txt, encoding='utf-8')
        count += 1
        print(f"Added affiliate links to: {subdir}")

print(f"\nDone — {count} pages updated")
