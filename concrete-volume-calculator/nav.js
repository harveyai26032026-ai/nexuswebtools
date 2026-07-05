/* Concrete Calculator — nav drawer + search */
(function(){
  var SITEMAP = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Contact', href: '/contact/' },
    { label: 'Privacy Policy', href: '/privacy/' },
    { label: 'Terms of Service', href: '/terms/' },
    { label: 'Concrete Calculator', href: '/', tier: 1 },
    { label: 'Guides', href: '/guides/shed-slab-calculator/', tier: 1, children: [
      { label: 'Shed Slab Calculator', href: '/guides/shed-slab-calculator/' },
      { label: 'Concrete Mix Ratios', href: '/guides/concrete-mix-ratios/' },
      { label: 'Saw Cuts in Concrete', href: '/guides/saw-cuts-in-concrete/' },
      { label: 'Driveway Concrete Calculator', href: '/guides/driveway-concrete-calculator/' },
      { label: 'Pouring on Uneven Ground', href: '/guides/pouring-on-uneven-ground/' },
    ]},
    { label: 'Nexus Web Tools', href: 'https://nexuswebtools.com/', tier: 1, external: true, children: [
      { label: 'Compound Interest', href: 'https://nexuswebtools.com/compound-interest/' },
      { label: 'Mortgage Calculator', href: 'https://nexuswebtools.com/mortgage/' },
      { label: 'Unit Converter', href: 'https://nexuswebtools.com/unit-converter/' },
      { label: 'S-Curve Model', href: 'https://nexuswebtools.com/s-curve/' },
    ]},
  ];

  var btn = document.querySelector('.hamburger');
  var d = null;

  function buildDrawer(){
    var overlay=document.createElement('div');overlay.className='drawer-overlay';document.body.appendChild(overlay);
    var drawer=document.createElement('div');drawer.className='drawer';
    var html = '<div class="drawer-head"><span class="brand">🏗️ Concrete Calculator</span><button class="drawer-close" aria-label="Close menu"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><ul class="drawer-nav">';
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

    // Attach toggle listeners for collapsible sub-menus
    drawer.querySelectorAll('.drawer-toggle').forEach(function(t){
      t.addEventListener('click',function(e){e.stopPropagation();t.parentNode.classList.toggle('open');});
    });

    // Close handlers — close drawer AND reset hamburger icon
    overlay.addEventListener('click', function(){close();resetHam();});
    drawer.querySelector('.drawer-close').addEventListener('click', function(){close();resetHam();});
    return{overlay:overlay,drawer:drawer};
  }

  function open(){if(!d)d=buildDrawer();d.drawer.classList.add('open');d.overlay.classList.add('visible');document.body.style.overflow='hidden';}
  function close(){if(!d)return;d.drawer.classList.remove('open');d.overlay.classList.remove('visible');document.body.style.overflow='';}
  function resetHam(){if(btn)btn.classList.remove('open');}

  // Hamburger toggle — never adds .open, so icon always stays as hamburger
  if(btn)btn.addEventListener('click',function(){if(d&&d.drawer.classList.contains('open'))close();else open();});

  var searchBtn=document.querySelector('.ribbon-search-btn'),searchWrap=document.querySelector('.ribbon-search'),searchInput=document.querySelector('.ribbon-search input'),searchResults=null;
  if(searchBtn&&searchInput){
    searchBtn.addEventListener('click',function(){searchWrap.classList.toggle('open');if(searchWrap.classList.contains('open'))searchInput.focus();});
    searchInput.addEventListener('focus',function(){searchWrap.classList.add('open');if(!searchResults)buildSR();if(searchInput.value.length>0)searchResults.classList.add('visible');});
    searchInput.addEventListener('input',function(){
      if(!searchResults)buildSR();
      var q=searchInput.value.trim().toLowerCase();
      if(!q){searchResults.classList.remove('visible');return;}
      var m=[];
      function walk(items,sec){items.forEach(function(it){if(it.children){walk(it.children,it.label);}else{if(it.label.toLowerCase().indexOf(q)!==-1)m.push({label:it.label,href:it.href,section:sec||''});}});}
      walk(SITEMAP);
      searchResults.innerHTML=m.length?m.slice(0,8).map(function(r){var s=r.section?'<span class="sr-section">'+r.section+' ›</span>':'';return '<a href="'+r.href+'">'+s+r.label+'</a>';}).join(''):'<div class="sr-empty">No results</div>';
      searchResults.classList.add('visible');
    });
    document.addEventListener('click',function(e){if(!searchWrap.contains(e.target)){searchWrap.classList.remove('open');if(searchResults)searchResults.classList.remove('visible');}});
  }
  function buildSR(){searchResults=document.createElement('div');searchResults.className='search-results';searchWrap.appendChild(searchResults);}
})();
