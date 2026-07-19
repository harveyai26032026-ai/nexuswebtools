// i18n loader — uses localStorage for language choice (no directory redirects needed).
(function(){
  function getLang(){
    var qs = (window.location.search || '').match(/[?&]lang=([a-zA-Z-]+)/);
    if(qs) return qs[1];  // preserve case (pt-BR not pt-br)
    try { var s = localStorage.getItem('nwt-lang'); if(s) return s; } catch(e){}
    return 'en';
  }
  var lang = getLang();
  try { localStorage.setItem('nwt-lang', lang); } catch(e){}

  // Highlight the active language button
  document.addEventListener('DOMContentLoaded', function(){
    var btns = document.querySelectorAll('.lang-switch a.lang');
    btns.forEach(function(b){
      var href = b.getAttribute('href') || '';
      var match = href.match(/[?&]lang=([a-zA-Z-]+)/);
      var code = match ? match[1] : 'en';
      if(code === lang){
        b.style.opacity = '1';
        b.style.borderBottom = '2px solid #3b5bdb';
        b.style.paddingBottom = '2px';
      } else {
        b.style.opacity = '0.55';
      }
    });
  });

  fetch('/locales/' + lang + '.json')
    .then(function(r){ if(!r.ok) throw new Error('locale not found'); return r.json(); })
    .then(function(tr){
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
      var html = document.documentElement;
      if(html) html.setAttribute('lang', lang === 'en' ? 'en' : lang);
    })
    .catch(function(){
      // If locale fails to load, silently fall back to English content already in DOM
      console.warn('Locale not found: ' + lang + ' — using default English.');
    });
})();
