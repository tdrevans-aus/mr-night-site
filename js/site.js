/* Mr Night website: interactivity only. All content is built into the HTML by build.js.
   - Floating WhatsApp chat bubble (Join.chat style)
   - Bubble steps aside when it would cover another WhatsApp button
   The 3-day/4-day switch (CSS radio buttons) and drop-downs (<details>) work without JS. */
(function () {
  'use strict';
  var jc = document.getElementById('jc');
  if (!jc) return;
  var jb = document.getElementById('jcbtn');
  var box = jc.querySelector('.jc-box');
  var label = jb.getAttribute('aria-label');

  function toggle(open) {
    jc.classList.toggle('open', open);
    box.setAttribute('aria-hidden', open ? 'false' : 'true');
    jb.setAttribute('aria-label', open ? 'Open WhatsApp chat' : label);
    if (open) jc.classList.remove('has-badge', 'dodge');
  }
  jb.addEventListener('click', function (e) {
    if (!jc.classList.contains('open')) { e.preventDefault(); toggle(true); }
    else { jb.target = '_blank'; jb.rel = 'noopener'; }
  });
  jc.querySelector('.jc-close').addEventListener('click', function () { toggle(false); jb.focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && jc.classList.contains('open')) toggle(false); });

  var q = new URLSearchParams(location.search).get('chat');
  setTimeout(function () { jc.classList.add('show'); check(); }, q ? 0 : 3000);
  setTimeout(function () { jc.classList.add('has-badge'); }, q ? 0 : 6000);
  if (q === 'open') toggle(true);

  /* Hide the bubble while it overlaps another button or link (small screens). */
  var targets = Array.prototype.slice.call(document.querySelectorAll('main a, main button, main summary, main label, main .btn, footer a, footer button'));
  var ticking = false;
  function check() {
    ticking = false;
    if (jc.classList.contains('open')) return;
    var r = jb.getBoundingClientRect(), pad = 6, hit = false;
    for (var i = 0; i < targets.length && !hit; i++) {
      var t = targets[i].getBoundingClientRect();
      if (t.width && t.right > r.left - pad && t.left < r.right + pad && t.bottom > r.top - pad && t.top < r.bottom + pad) hit = true;
    }
    jc.classList.toggle('dodge', hit);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('scrollend', check, { passive: true });
  setInterval(function () { if (!document.hidden) check(); }, 400);
})();

/* Translate menu: our own drop-down. Google's free Website Translator is only loaded once a visitor
   picks a language (it is remembered in Google's "googtrans" cookie), so most visits never contact Google.
   If Google's script is blocked or fails, the page simply stays in English. */
(function () {
  'use strict';
  var tr = document.getElementById('tr');
  if (!tr) return;
  var sel = tr.querySelector('select'), lbl = tr.querySelector('.tr-lbl');
  if (!sel) return;
  var SHORT = { en: 'EN', km: 'ខ្មែរ', th: 'ไทย', 'zh-CN': '中文', ko: '한국어', fr: 'FR', ja: '日本語' };
  function setCookie(v) {
    var host = location.hostname, parts = host.split('.');
    var exp = v ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    var set = function (d) { document.cookie = 'googtrans=' + v + exp + '; path=/' + (d ? '; domain=' + d : '') + '; SameSite=Lax'; };
    if (!v) { set(''); set(host); set('.' + host); if (parts.length > 2) set('.' + parts.slice(-2).join('.')); }
    else set('');
  }
  function loadGoogle() {
    window.mnTranslateInit = function () {
      try { new google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'en,' + sel.getAttribute('data-langs'), autoDisplay: false }, 'google_translate_element'); } catch (e) {}
    };
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=mnTranslateInit';
    s.async = true;
    document.head.appendChild(s);
  }
  var m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
  var cur = m ? decodeURIComponent(m[1]) : '';
  if (cur && sel.querySelector('option[value="' + cur.replace(/[^A-Za-z-]/g, '') + '"]')) {
    sel.value = cur; lbl.textContent = SHORT[cur] || cur.toUpperCase(); loadGoogle();
  }
  tr.hidden = false;
  sel.addEventListener('change', function () {
    setCookie(sel.value ? '/en/' + sel.value : '');
    location.reload();
  });
})();
