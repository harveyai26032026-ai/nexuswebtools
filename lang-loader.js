// Simple i18n loader – reads /locales/<lang>.json and replaces elements with data-i18n attributes.
(function(){
  const pathParts = location.pathname.split('/').filter(Boolean);
  const lang = pathParts[0] && /^[a-z]{2}(-[A-Z]{2})?$/.test(pathParts[0]) ? pathParts[0] : 'en';
  fetch(`/locales/${lang}.json`).then(r=>r.json()).then(tr=>{
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      if(tr[key]){
        if(el.tagName.toLowerCase() === 'title'){
          document.title = tr[key];
        } else {
          el.textContent = tr[key];
        }
      }
    });
  }).catch(()=>{console.warn('i18n load failed for', lang);});
})();
