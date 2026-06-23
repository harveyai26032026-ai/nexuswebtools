/* Nexus Web Tools — nav drawer + search */
(function(){
  /* ─── Sitemap data ─── */
  const SITEMAP = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Contact', href: '/contact/' },
    { label: 'Privacy Policy', href: '/privacy/' },
    { label: 'Terms of Service', href: '/terms/' },
    { label: 'Compound Interest', href: '/compound-interest/', tier: 1, children: [
      { label: 'Savings', href: '/compound-interest/savings/' },
      { label: 'Mortgage', href: '/compound-interest/mortgage/' },
      { label: 'Retirement', href: '/compound-interest/retirement/' },
      { label: 'Investments', href: '/compound-interest/investments/' },
      { label: 'Superannuation', href: '/compound-interest/superannuation/' },
      { label: 'Term Deposit', href: '/compound-interest/term-deposit/' },
      { label: 'Student Loan', href: '/compound-interest/student-loan/' },
      { label: 'Credit Card', href: '/compound-interest/credit-card/' },
      { label: 'Car Loan', href: '/compound-interest/car-loan/' },
      { label: 'Home Loan', href: '/compound-interest/home-loan/' },
      { label: 'Personal Loan', href: '/compound-interest/personal-loan/' },
      { label: 'Fixed Deposit', href: '/compound-interest/fixed-deposit/' },
      { label: 'Recurring Deposit', href: '/compound-interest/recurring-deposit/' },
      { label: 'Annuity', href: '/compound-interest/annuity/' },
      { label: 'Crypto', href: '/compound-interest/crypto/' },
      { label: 'Dividend', href: '/compound-interest/dividend/' },
      { label: 'Bond', href: '/compound-interest/bond/' },
      { label: 'Mutual Fund', href: '/compound-interest/mutual-fund/' },
      { label: 'ETF', href: '/compound-interest/etf/' },
      { label: 'Real Estate', href: '/compound-interest/real-estate/' },
      { label: 'Business Loan', href: '/compound-interest/business-loan/' },
      { label: 'Monthly', href: '/compound-interest/monthly/' },
      { label: 'Daily', href: '/compound-interest/daily/' },
      { label: 'Quarterly', href: '/compound-interest/quarterly/' },
      { label: 'Annually', href: '/compound-interest/annually/' },
      { label: 'Continuous', href: '/compound-interest/continuous/' },
      { label: 'Simple vs Compound', href: '/compound-interest/simple-vs-compound/' },
      { label: 'Inflation Adjusted', href: '/compound-interest/inflation-adjusted/' },
      { label: 'Early Retirement', href: '/compound-interest/early-retirement/' },
      { label: 'Education Fund', href: '/compound-interest/education-fund/' },
      { label: 'Emergency Fund', href: '/compound-interest/emergency-fund/' },
      { label: 'Wealth Building', href: '/compound-interest/wealth-building/' },
      { label: 'Debt Payoff', href: '/compound-interest/debt-payoff/' },
      { label: 'Compound Frequency', href: '/compound-interest/compound-frequency/' },
      { label: 'Rule of 72', href: '/compound-interest/rule-of-72/' },
      { label: 'FHA Loan', href: '/compound-interest/fha-loan/' },
    ]},
    { label: 'Mortgage Calculator', href: '/mortgage/', tier: 1 },
    { label: 'Unit Converter', href: '/unit-converter/', tier: 1, children: [
      { label: 'Length', href: '/unit-converter/length/' },
      { label: 'Weight', href: '/unit-converter/weight/' },
      { label: 'Temperature', href: '/unit-converter/temperature/' },
      { label: 'Speed', href: '/unit-converter/speed/' },
      { label: 'Area', href: '/unit-converter/area/' },
      { label: 'Volume', href: '/unit-converter/volume/' },
      { label: 'Pressure', href: '/unit-converter/pressure/' },
      { label: 'Energy', href: '/unit-converter/energy/' },
      { label: 'Power', href: '/unit-converter/power/' },
      { label: 'Data', href: '/unit-converter/data/' },
      { label: 'Time', href: '/unit-converter/time/' },
      { label: 'Angle', href: '/unit-converter/angle/' },
      { label: 'Frequency', href: '/unit-converter/frequency/' },
      { label: 'Torque', href: '/unit-converter/torque/' },
      { label: 'Fuel', href: '/unit-converter/fuel/' },
      { label: 'Force', href: '/unit-converter/force/' },
      { label: 'Density', href: '/unit-converter/density/' },
      { label: 'Flow Rate', href: '/unit-converter/flow-rate/' },
      { label: 'Illuminance', href: '/unit-converter/illuminance/' },
      { label: 'Radiation', href: '/unit-converter/radiation/' },
      { label: 'Viscosity', href: '/unit-converter/viscosity/' },
      { label: 'mm → Inches', href: '/unit-converter/mm-to-inches/' },
      { label: 'cm → Inches', href: '/unit-converter/cm-to-inches/' },
      { label: 'Inches → cm', href: '/unit-converter/inches-to-cm/' },
      { label: 'kg → lbs', href: '/unit-converter/kg-to-lbs/' },
      { label: 'lbs → kg', href: '/unit-converter/lbs-to-kg/' },
      { label: '°F → °C', href: '/unit-converter/f-to-c/' },
      { label: '°C → °F', href: '/unit-converter/c-to-f/' },
      { label: 'm → ft', href: '/unit-converter/meters-to-feet/' },
      { label: 'ft → m', href: '/unit-converter/feet-to-meters/' },
      { label: 'km → mi', href: '/unit-converter/km-to-miles/' },
      { label: 'mi → km', href: '/unit-converter/miles-to-km/' },
      { label: 'L → gal', href: '/unit-converter/liters-to-gallons/' },
      { label: 'gal → L', href: '/unit-converter/gallons-to-liters/' },
      { label: 'm² → ft²', href: '/unit-converter/sqm-to-sqft/' },
      { label: 'ac → ha', href: '/unit-converter/acres-to-hectares/' },
      { label: 'psi → bar', href: '/unit-converter/psi-to-bar/' },
      { label: 'kg → st', href: '/unit-converter/kg-to-stone/' },
      { label: 'oz → ml', href: '/unit-converter/oz-to-ml/' },
      { label: 'cups → ml', href: '/unit-converter/cups-to-ml/' },
      { label: 'MB → GB', href: '/unit-converter/mb-to-gb/' },
      { label: 'kW → HP', href: '/unit-converter/kw-to-hp/' },
      { label: 'J → cal', href: '/unit-converter/joules-to-calories/' },
      { label: 'kn → mph', href: '/unit-converter/knots-to-mph/' },
      { label: 'lbs → oz', href: '/unit-converter/lbs-to-ounces/' },
      { label: 'g → oz', href: '/unit-converter/grams-to-ounces/' },
      { label: 'ft → in', href: '/unit-converter/feet-to-inches/' },
      { label: 'yd → m', href: '/unit-converter/yards-to-meters/' },
      { label: 'gal → L', href: '/unit-converter/gallons-to-litres/' },
    ]},
    { label: 'S-Curve', href: '/s-curve/', tier: 1, children: [
      { label: 'Construction', href: '/s-curve/construction/' },
      { label: 'Project Management', href: '/s-curve/project-management/' },
      { label: 'Financial Forecasting', href: '/s-curve/financial-forecasting/' },
      { label: 'Budget Tracking', href: '/s-curve/budget-tracking/' },
      { label: 'Engineering', href: '/s-curve/engineering/' },
      { label: 'Mining', href: '/s-curve/mining/' },
      { label: 'Oil & Gas', href: '/s-curve/oil-gas/' },
      { label: 'Infrastructure', href: '/s-curve/infrastructure/' },
      { label: 'IT Project', href: '/s-curve/it-project/' },
      { label: 'Earned Value', href: '/s-curve/earned-value/' },
      { label: 'Cash Flow', href: '/s-curve/cash-flow/' },
      { label: 'Resource Planning', href: '/s-curve/resource-planning/' },
    ]},
    { label: 'Concrete Calculator', href: 'https://concrete-calcs.com/', tier: 1, external: true },
  ];

  /* ─── Build drawer HTML ─── */
  function buildDrawer() {
    var overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    document.body.appendChild(overlay);

    var drawer = document.createElement('div');
    drawer.className = 'drawer';
    var html = '<div class="drawer-head"><span class="brand">🧰 Nexus Web Tools</span><button class="drawer-close" aria-label="Close menu"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><ul class="drawer-nav">';
    SITEMAP.forEach(function(item) {
      var cls = item.tier ? ' class="dn-tier1"' : '';
      var ext = item.external ? ' <span class="dn-external">↗</span>' : '';
      html += '<li class="has-children">';
      if (item.children) {
        html += '<button class="drawer-toggle" aria-label="Expand '+item.label+'">▶</button>';
      }
      html += '<a href="' + item.href + '"' + cls + '>' + item.label + ext + '</a>';
      if (item.children) {
        html += '<ul class="drawer-sub">';
        item.children.forEach(function(ch) {
          html += '<li><a href="' + ch.href + '" class="dn-tier2">' + ch.label + '</a></li>';
        });
        html += '</ul>';
      }
      html += '</li>';
    });
    html += '</ul>';
    drawer.innerHTML = html;
    document.body.appendChild(drawer);

    // Attach toggle listeners for collapsible sub‑menus
    function attachToggles(){
      var toggles = drawer.querySelectorAll('.drawer-toggle');
      toggles.forEach(function(btn){
        btn.addEventListener('click',function(e){
          e.stopPropagation(); // prevent link navigation
          var li = btn.parentNode; // the <li class="has-children">
          li.classList.toggle('open');
        });
      });
    }
    attachToggles();
    // Close handlers — close drawer AND reset hamburger icon
    overlay.addEventListener('click', function() { close(); resetHamburger(); });
    drawer.querySelector('.drawer-close').addEventListener('click', function() { close(); resetHamburger(); });
    return { overlay: overlay, drawer: drawer };
  }

  /* ─── Drawer open/close ─── */
  var drawerObj = null;
  var btn = document.querySelector('.hamburger');

  function open() {
    if (!drawerObj) drawerObj = buildDrawer();
    drawerObj.drawer.classList.add('open');
    drawerObj.overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if (!drawerObj) return;
    drawerObj.drawer.classList.remove('open');
    drawerObj.overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }
  function resetHamburger() {
    if (btn) btn.classList.remove('open');
  }

  // Hamburger toggle — always keeps the hamburger icon visible
  if (btn) btn.addEventListener('click', function() {
    if (drawerObj && drawerObj.drawer.classList.contains('open')) {
      close();
      // Don't add .open — hamburger icon stays as hamburger
    } else {
      open();
      // Don't add .open — hamburger icon stays as hamburger
    }
  });

  /* ─── Search ─── */
  var searchBtn = document.querySelector('.ribbon-search-btn');
  var searchWrap = document.querySelector('.ribbon-search');
  var searchInput = document.querySelector('.ribbon-search input');
  var searchResults = document.querySelector('.search-results');

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', function() {
      searchWrap.classList.toggle('open');
      if (searchWrap.classList.contains('open')) searchInput.focus();
    });
    searchInput.addEventListener('focus', function() {
      searchWrap.classList.add('open');
      if (!searchResults) buildSearchResults();
      if (searchInput.value.length > 0) searchResults.classList.add('visible');
    });
    searchInput.addEventListener('input', function() {
      if (!searchResults) buildSearchResults();
      var q = searchInput.value.trim().toLowerCase();
      if (q.length === 0) { searchResults.classList.remove('visible'); return; }
      var matches = [];
      SITEMAP.forEach(function(item) {
        if (item.children) return; // skip parent entries with children for search
        if (item.label.toLowerCase().indexOf(q) !== -1) matches.push(item);
      });
      // Also search children
      SITEMAP.forEach(function(item) {
        if (!item.children) return;
        item.children.forEach(function(ch) {
          if (ch.label.toLowerCase().indexOf(q) !== -1) {
            matches.push({ label: ch.label, href: ch.href, section: item.label });
          }
        });
      });
      // Also search tier1 items
      SITEMAP.forEach(function(item) {
        if (!item.tier || item.children) return;
        if (item.label.toLowerCase().indexOf(q) !== -1) matches.push({ label: item.label, href: item.href });
      });
      if (matches.length === 0) {
        searchResults.innerHTML = '<div class="sr-empty">No results</div>';
      } else {
        searchResults.innerHTML = matches.slice(0, 12).map(function(m) {
          var sec = m.section ? '<span class="sr-section">' + m.section + ' ›</span>' : '';
          return '<a href="' + m.href + '">' + sec + m.label + '</a>';
        }).join('');
      }
      searchResults.classList.add('visible');
    });
    // Close search on click outside
    document.addEventListener('click', function(e) {
      if (!searchWrap.contains(e.target)) {
        searchWrap.classList.remove('open');
        if (searchResults) searchResults.classList.remove('visible');
      }
    });
  }

  function buildSearchResults() {
    searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchWrap.style.position = 'relative';
    searchWrap.appendChild(searchResults);
  }
})();
