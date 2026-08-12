#!/usr/bin/env python3
"""
Generate a concrete volume calculator page for nexuswebtools.com
matching the content depth of concretecalculatormax.com
"""
import pathlib

OUTPUT = pathlib.Path('/home/harvey/nexuswebtools/concrete-volume-calculator/index.html')

HTML = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Concrete Volume Calculator — m³, ft³, Bags & Mix | Nexus Web Tools</title>
<meta name="description" content="Free concrete calculator — enter dimensions in metric or imperial to get volume in m³, ft³, yd³, weight in kg/lb, and bag counts for 20kg, 25kg, 40kg, 60lb, and 80lb bags. Instant results.">
<meta name="keywords" content="concrete calculator, concrete volume, concrete bags, cubic metre calculator, cubic yard calculator, slab calculator, concrete estimation">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="author" content="Nexus Web Tools">
<link rel="canonical" href="https://nexuswebtools.com/concrete-volume-calculator/">
<meta property="og:type" content="website">
<meta property="og:title" content="Concrete Volume Calculator — m³, ft³, Bags & Mix">
<meta property="og:description" content="Free concrete calculator — volume in m³/ft³/yd³, weight, and bag counts. Metric and imperial.">
<meta property="og:url" content="https://nexuswebtools.com/concrete-volume-calculator/">
<meta property="og:site_name" content="Nexus Web Tools">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Concrete Volume Calculator">
<meta name="twitter:description" content="Free concrete calculator — volume, weight, and bag counts.">
<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
<link rel="dns-prefetch" href="http://resources.infolinks.com">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XY5PSBLW98"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XY5PSBLW98', { 'anonymize_ip': true });
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "Concrete Volume Calculator",
      "url": "https://nexuswebtools.com/concrete-volume-calculator/",
      "applicationCategory": "Calculators",
      "operatingSystem": "Any",
      "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
      "description": "Free concrete calculator — enter dimensions to get volume in m³, ft³, yd³, weight, and bag counts."
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {"@type": "Question", "name": "How much concrete do I need for a slab?", "acceptedAnswer": {"@type": "Answer", "text": "Multiply length × width × thickness for the volume. A 5m × 3m slab at 100mm needs 1.5m³. Add 5-10% waste allowance."}},
        {"@type": "Question", "name": "How many bags of concrete in a cubic metre?", "acceptedAnswer": {"@type": "Answer", "text": "About 100 × 20kg bags, 67 × 30kg bags, or 50 × 40kg bags per cubic metre of normal-weight concrete."}},
        {"@type": "Question", "name": "How many 80lb bags in a cubic yard?", "acceptedAnswer": {"@type": "Answer", "text": "Roughly 45 × 80lb bags per cubic yard. Each 80lb bag yields about 0.60 ft³."}},
        {"@type": "Question", "name": "What is the density of concrete?", "acceptedAnswer": {"@type": "Answer", "text": "Normal-weight concrete is 2,400 kg/m³ (150 lb/ft³). Lightweight concrete is about 1,762 kg/m³. Bag mix is about 2,130 kg/m³."}},
        {"@type": "Question", "name": "Should I add a waste allowance?", "acceptedAnswer": {"@type": "Answer", "text": "Yes — add 5-10% to the calculated volume to account for spillage, over-excavation, and sub-grade irregularity."}}
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://nexuswebtools.com/"},
        {"@type": "ListItem", "position": 2, "name": "Concrete Calculator", "item": "https://nexuswebtools.com/concrete-volume-calculator/"}
      ]
    }
  ]
}
</script>
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/nav.css">
<style>
  .calc-container { max-width: 600px; margin: 2rem auto; background: #f8f9fa; border-radius: 12px; padding: 2rem; }
  .calc-group { margin-bottom: 1.5rem; }
  .calc-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; }
  .calc-group input, .calc-group select { width: 100%; padding: 0.6rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
  .calc-row { display: flex; gap: 1rem; }
  .calc-row > div { flex: 1; }
  .calc-btn { background: #3b5bdb; color: white; border: none; padding: 0.8rem 2rem; border-radius: 6px; font-size: 1.1rem; cursor: pointer; }
  .calc-btn:hover { background: #2c3faf; }
  .results { margin-top: 2rem; padding: 1.5rem; background: white; border-radius: 8px; border-left: 4px solid #3b5bdb; }
  .results table { width: 100%; border-collapse: collapse; }
  .results td { padding: 0.5rem; border-bottom: 1px solid #eee; }
  .results td:first-child { font-weight: 600; }
  .ref-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
  .ref-table th, .ref-table td { padding: 0.6rem; border: 1px solid #ddd; text-align: left; }
  .ref-table th { background: #e3f2fd; }
  .ref-table tr:nth-child(even) { background: #f8f9fa; }
</style>
</head>
<body>
<header class="ribbon">
  <div class="ribbon-inner">
    <button class="hamburger" aria-label="Open menu">
      <svg class="icon-open" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      <svg class="icon-close" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="brand"><a href="/">🧰 Nexus Web Tools</a></div>
    <nav class="nav-ribbon">
      <a href="/">Home</a>
      <a href="/#tools">Tools</a>
    </nav>
  </div>
  <div class="scroll-bar"><div class="scroll-bar-fill"></div></div>
</header>

<main class="container">
  <nav style="font-size:0.85rem; margin-bottom:1rem;">
    <a href="/">Home</a> → <span>Concrete Calculator</span>
  </nav>

  <h1>Concrete Volume Calculator</h1>
  <p class="lede">Enter dimensions in metric or imperial to get volume in m³, ft³, yd³, weight, and bag counts. Free, instant, no sign-up.</p>

  <div class="calc-container">
    <div class="calc-group">
      <label for="shape">Shape</label>
      <select id="shape">
        <option value="slab">Slab / Footing (rectangular)</option>
        <option value="column">Column / Tube (round)</option>
      </select>
    </div>
    <div class="calc-row">
      <div class="calc-group">
        <label for="length">Length</label>
        <input type="number" id="length" value="5" step="0.01">
      </div>
      <div class="calc-group">
        <label for="width">Width / Diameter</label>
        <input type="number" id="width" value="3" step="0.01">
      </div>
    </div>
    <div class="calc-row">
      <div class="calc-group">
        <label for="depth">Thickness / Depth</label>
        <input type="number" id="depth" value="0.1" step="0.01">
      </div>
      <div class="calc-group">
        <label for="units">Unit System</label>
        <select id="units">
          <option value="metric">Metric (m, cm, mm)</option>
          <option value="imperial">Imperial (ft, in, yd)</option>
        </select>
      </div>
    </div>
    <div class="calc-group">
      <label for="waste">Waste Allowance</label>
      <select id="waste">
        <option value="0">0%</option>
        <option value="5" selected>5%</option>
        <option value="10">10%</option>
      </select>
    </div>
    <button class="calc-btn" onclick="calculateConcrete()">Calculate</button>
    <div id="results" class="results" style="display:none;">
      <h3>Results</h3>
      <table id="resultsTable"></table>
    </div>
  </div>

  <section>
    <h2>How to Calculate Concrete Volume</h2>
    <p>Calculating concrete volume is the first step in any pour — whether you're ordering ready-mix delivery or buying bags from a hardware store. The formula depends on the shape of your element, but the principle is always the same: multiply the three dimensions to get volume, add a waste allowance, then convert to the units your supplier uses.</p>

    <h3>Rectangular Slab or Footing</h3>
    <p>For a rectangular slab, footing, or wall: <strong>Volume = Length × Width × Thickness</strong>. All dimensions must be in the same unit before multiplying. For example, a slab that's 5 metres long, 3 metres wide, and 100 mm (0.1 m) thick has a volume of 5 × 3 × 0.1 = 1.5 m³.</p>

    <h3>Round Column or Pier</h3>
    <p>For a circular column or sonotube: <strong>Volume = π × radius² × height</strong>. The radius is half the diameter. A 300 mm diameter column that's 600 mm tall has a volume of π × 0.15² × 0.6 = 0.0424 m³ per column. For multiple columns, multiply by the quantity.</p>

    <h3>Converting Between Units</h3>
    <p>If your drawings mix metric and imperial, convert everything to one system first:</p>
    <ul>
      <li><strong>1 m³ = 35.3147 ft³</strong></li>
      <li><strong>1 m³ = 1.30795 yd³</strong></li>
      <li><strong>1 ft³ = 0.0283168 m³</strong></li>
      <li><strong>1 yd³ = 0.764555 m³</strong></li>
      <li><strong>1 yd³ = 27 ft³</strong></li>
    </ul>
  </section>

  <section>
    <h2>Bag Count Reference Table</h2>
    <p>Use this table to estimate how many bags of pre-mixed concrete you need per cubic metre or cubic yard:</p>
    <table class="ref-table">
      <thead>
        <tr><th>Bag Size</th><th>Yield</th><th>Bags per m³</th><th>Bags per yd³</th></tr>
      </thead>
      <tbody>
        <tr><td>20 kg</td><td>≈0.010 m³</td><td>≈100</td><td>≈76</td></tr>
        <tr><td>25 kg</td><td>≈0.012 m³</td><td>≈83</td><td>≈63</td></tr>
        <tr><td>30 kg</td><td>≈0.015 m³</td><td>≈67</td><td>≈51</td></tr>
        <tr><td>40 kg</td><td>≈0.020 m³</td><td>≈50</td><td>≈38</td></tr>
        <tr><td>60 lb</td><td>≈0.45 ft³</td><td>≈79</td><td>≈60</td></tr>
        <tr><td>80 lb</td><td>≈0.60 ft³</td><td>≈59</td><td>≈45</td></tr>
      </tbody>
    </table>
    <p><em>Yields are typical for pre-mixed bagged concrete. Always check your supplier's stated yield for exact figures.</em></p>
  </section>

  <section>
    <h2>Worked Examples</h2>

    <h3>Example 1: Shed Slab (Metric)</h3>
    <p>A 5 m × 3 m shed slab at 100 mm thick: Volume = 5 × 3 × 0.1 = 1.5 m³. With a 5% waste allowance, that's 1.575 m³ — roughly 158 × 20 kg bags. At this volume, ready-mix delivery is usually cheaper than bags.</p>

    <h3>Example 2: Patio Slab (Imperial)</h3>
    <p>A 10 ft × 10 ft patio slab at 4 inches thick: Volume = 10 × 10 × (4 ÷ 12) = 33.3 ft³ = 1.23 cubic yards — about 56 × 80 lb bags.</p>

    <h3>Example 3: Round Deck Footings</h3>
    <p>Six footings, each 300 mm diameter × 600 mm deep: Each = π × 0.15² × 0.6 ≈ 0.042 m³. Six footings = 0.25 m³ total — about 25 × 20 kg bags with a 5% allowance.</p>

    <h3>Example 4: Strip Footing (Metric)</h3>
    <p>A 10 m strip footing, 0.4 m wide, 0.5 m deep: Volume = 10 × 0.4 × 0.5 = 2.0 m³. Weight at 2,400 kg/m³ = 4,800 kg (4.8 metric tons). Bag counts: 213 × 20 kg bags, 171 × 25 kg bags, or 106 × 40 kg bags. Add 5-10% for waste.</p>
  </section>

  <section>
    <h2>Concrete Density by Type</h2>
    <table class="ref-table">
      <thead>
        <tr><th>Type</th><th>Density (kg/m³)</th><th>Density (lb/ft³)</th><th>Source</th></tr>
      </thead>
      <tbody>
        <tr><td>Normal weight</td><td>2,400</td><td>150</td><td>ACI 318</td></tr>
        <tr><td>Lightweight</td><td>1,762</td><td>110</td><td>ACI 213R</td></tr>
        <tr><td>Bag mix (pre-mix)</td><td>2,130</td><td>133</td><td>Manufacturer typical</td></tr>
      </tbody>
    </table>
    <p>Density matters for two reasons: it determines the weight of the pour (important for truck limits and dead-load calculations), and it affects bag yield — denser mixes produce slightly less volume per bag.</p>
  </section>

  <section>
    <h2>Ordering Tips</h2>
    <ul>
      <li><strong>Ready-mix minimums:</strong> Most plants have a minimum delivery (typically 1-3 m³) and charge short-load fees for smaller orders. A job that reads as 0.5 m³ may cost as much as a full 1 m³ load.</li>
      <li><strong>Waste allowance:</strong> Always add 5-10% to the theoretical volume. Footings poured against trench walls lose material to formwork gaps and over-excavation.</li>
      <li><strong>Round up bag counts:</strong> Bag yields on the label are slightly optimistic — hand-mixing loses a little volume. Round up and keep a spare bag.</li>
      <li><strong>Plan for pump capacity:</strong> If pumping, check the weight against pump limits. A 2 m³ pour at 2,400 kg/m³ weighs 4.8 tonnes.</li>
      <li><strong>Order by volume, not bags:</strong> For ready-mix, order in m³ or yd³. For bags, order by count with the waste allowance already included.</li>
    </ul>
  </section>

  <section id="faq">
    <h2>Frequently Asked Questions</h2>

    <h3>How much concrete do I need for a slab?</h3>
    <p>Multiply length × width × thickness for the volume, then read it in cubic metres or cubic yards. A 5 m × 3 m slab at 100 mm needs 1.5 m³. Add 5-10% for waste. Enter your dimensions above for an instant figure.</p>

    <h3>How many bags of concrete are in a cubic metre?</h3>
    <p>About 100 × 20 kg bags, 67 × 30 kg bags, or 50 × 40 kg bags per cubic metre of normal-weight concrete. See the reference table above for all bag sizes.</p>

    <h3>How many 80 lb bags are in a cubic yard?</h3>
    <p>Roughly 45 × 80 lb bags per cubic yard. Each 80 lb bag yields about 0.60 ft³.</p>

    <h3>What is the density of concrete?</h3>
    <p>Normal-weight concrete is 2,400 kg/m³ (150 lb/ft³). Lightweight concrete is about 1,762 kg/m³ per ACI 213R. Pre-mix bag concrete is about 2,130 kg/m³.</p>

    <h3>Should I add a waste allowance?</h3>
    <p>Yes — add 5-10% to the calculated volume. This accounts for spillage, over-excavation, sub-grade irregularity, and formwork gaps. The calculator above includes this option.</p>

    <h3>How do I calculate concrete for a round column?</h3>
    <p>Use the formula π × radius² × height. For a 300 mm diameter column 600 mm tall: π × 0.15² × 0.6 = 0.042 m³. Multiply by the number of columns.</p>

    <h3>Is it cheaper to use bags or ready-mix?</h3>
    <p>For pours under about 1 m³, bags are usually cheaper (no minimum delivery fee). For pours over 1-2 m³, ready-mix is typically cheaper per cubic metre. Bagged concrete also requires mixing labour.</p>

    <h3>How do I convert cubic feet to cubic yards?</h3>
    <p>Divide cubic feet by 27 to get cubic yards. For example, 33.3 ft³ ÷ 27 = 1.23 yd³.</p>
  </section>

  <section>
    <h2>Related Tools</h2>
    <ul>
      <li><a href="/">Nexus Web Tools Home</a> — all calculators</li>
      <li><a href="/compound-interest/savings/">Savings Calculator</a> — model compound growth</li>
      <li><a href="/percentage/">Percentage Calculator</a> — quick percentage maths</li>
      <li><a href="/unit-converter/">Unit Converter</a> — 40+ categories</li>
    </ul>
  </section>

</main>

<script>
function calculateConcrete() {
  var shape = document.getElementById('shape').value;
  var length = parseFloat(document.getElementById('length').value);
  var width = parseFloat(document.getElementById('width').value);
  var depth = parseFloat(document.getElementById('depth').value);
  var units = document.getElementById('units').value;
  var waste = parseInt(document.getElementById('waste').value);

  if (!length || !width || !depth) { alert('Please enter all dimensions'); return; }

  var vol;
  if (shape === 'slab') {
    vol = length * width * depth;
  } else {
    var radius = width / 2;
    vol = Math.PI * radius * radius * depth;
  }

  var volM3, volFt3, volYd3;
  if (units === 'metric') {
    volM3 = vol;
    volFt3 = vol * 35.3147;
    volYd3 = vol * 1.30795;
  } else {
    volFt3 = vol;
    volM3 = vol * 0.0283168;
    volYd3 = vol / 27;
  }

  // Apply waste
  var wasteMult = 1 + waste / 100;
  volM3 *= wasteMult;
  volFt3 *= wasteMult;
  volYd3 *= wasteMult;

  // Weight
  var weightKg = volM3 * 2400;
  var weightLb = volFt3 * 150;

  // Bag counts (ceiling)
  var bags20 = Math.ceil(volM3 / 0.0094);
  var bags25 = Math.ceil(volM3 / 0.0117);
  var bags40 = Math.ceil(volM3 / 0.019);
  var bags60 = Math.ceil(volFt3 / 0.45);
  var bags80 = Math.ceil(volFt3 / 0.60);

  var html = '';
  html += '<tr><td>Volume (m³)</td><td>' + volM3.toFixed(3) + '</td></tr>';
  html += '<tr><td>Volume (ft³)</td><td>' + volFt3.toFixed(2) + '</td></tr>';
  html += '<tr><td>Volume (yd³)</td><td>' + volYd3.toFixed(3) + '</td></tr>';
  html += '<tr><td>Weight (kg)</td><td>' + weightKg.toFixed(0) + '</td></tr>';
  html += '<tr><td>Weight (lb)</td><td>' + weightLb.toFixed(0) + '</td></tr>';
  html += '<tr><td>20 kg bags</td><td>' + bags20 + '</td></tr>';
  html += '<tr><td>25 kg bags</td><td>' + bags25 + '</td></tr>';
  html += '<tr><td>40 kg bags</td><td>' + bags40 + '</td></tr>';
  html += '<tr><td>60 lb bags</td><td>' + bags60 + '</td></tr>';
  html += '<tr><td>80 lb bags</td><td>' + bags80 + '</td></tr>';

  document.getElementById('resultsTable').innerHTML = html;
  document.getElementById('results').style.display = 'block';
}
</script>
</body>
</html>
'''

# Write the file
pathlib.Path('/home/harvey/nexuswebtools/concrete-volume-calculator/').mkdir(parents=True, exist_ok=True)
pathlib.Path('/home/harvey/nexuswebtools/concrete-volume-calculator/index.html').write_text(HTML)
print(f'Written: /home/harvey/nexuswebtools/concrete-volume-calculator/index.html ({len(HTML)} bytes)')
