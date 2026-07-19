// i18n loader — uses localStorage for language choice (no directory redirects needed).
(function(){
  function getLang(){
    // 1. Check URL query param ?lang=xx
    var qs = (window.location.search || '').match(/[?&]lang=([a-zA-Z-]+)/);
    if(qs) return qs[1].toLowerCase();
    // 2. Check localStorage
    try { var s = localStorage.getItem('nwt-lang'); if(s) return s; } catch(e){}
    // 3. Default
    return 'en';
  }
  var lang = getLang();
  // Persist choice
  try { localStorage.setItem('nwt-lang', lang); } catch(e){}

  fetch('/locales/' + lang + '.json')
    .then(function(r){ if(!r.ok) throw new Error('locale not found'); return r.json(); })
    .then(function(tr){
      // Replace all data-i18n elements
      document.querySelectorAll('[data-i18n]').forEach(function(el){
        var key = el.getAttribute('data-i18n');
        if(tr[key]){
          if(el.tagName.toLowerCase() === 'title'){
            document.title = tr[key];
          } else {
            el.textContent = tr[key];
          }
        }
      });
      // Update <html lang="...">
      var html = document.documentElement;
      if(html) html.setAttribute('lang', lang === 'en' ? 'en' : lang);
    })
    .catch(function(){ /* silent fail for missing locale */ });
})();
