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

/* Translate menu: loads Google's free Website Translator only when the header holds #tr.
   If the script is blocked or fails, the menu stays hidden and nothing else on the page changes. */
(function () {
  'use strict';
  var tr = document.getElementById('tr');
  if (!tr) return;
  var langs = (tr.getAttribute('data-langs') || '').replace(/[^A-Za-z,-]/g, '');
  if (!langs) return;
  var NAMES = { en: 'EN', km: 'ខ្មែរ', th: 'ไทย', 'zh-CN': '中文', ko: '한국어', fr: 'FR', ja: '日本語' };
  /* Menu labels, each language in its own script, in the order given in site.json */
  var NATIVE = { km: 'ភាសាខ្មែរ', th: 'ไทย', 'zh-CN': '中文 (简体)', ko: '한국어', fr: 'Français', ja: '日本語' };
  var ORDER = langs.split(',');
  window.mnTranslateInit = function () {
    try {
      if (!window.google || !google.translate || !google.translate.TranslateElement) return;
      new google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'en,' + langs, autoDisplay: false }, 'google_translate_element');
      tr.hidden = false;
      var lbl = tr.querySelector('.tr-lbl');
      var restore = function () {
        var host = location.hostname, parts = host.split('.');
        var kill = function (d) { document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : ''); };
        kill(''); kill(host); kill('.' + host); if (parts.length > 2) kill('.' + parts.slice(-2).join('.'));
        location.reload();
      };
      var wire = function () {
        var sel = tr.querySelector('select.goog-te-combo');
        if (!sel) return setTimeout(wire, 300);
        sel.setAttribute('aria-label', 'Translate this page');
        var fixing = false;
        var fix = function () {
          if (fixing) return; fixing = true;
          try {
            var o = sel.options[0]; if (o && !o.value && o.textContent !== 'English') o.textContent = 'English';
            var opts = Array.prototype.slice.call(sel.options), byVal = {};
            opts.forEach(function (op) { byVal[op.value] = op; if (NATIVE[op.value] && op.textContent !== NATIVE[op.value]) { op.textContent = NATIVE[op.value]; op.lang = op.value; } });
            var want = [''].concat(ORDER).filter(function (v) { return byVal[v]; });
            var now = Array.prototype.map.call(sel.options, function (op) { return op.value; }).filter(function (v) { return want.indexOf(v) > -1; });
            if (now.join(',') !== want.join(',')) { var cur = sel.value; want.forEach(function (v) { sel.appendChild(byVal[v]); }); sel.value = cur; }
          } finally { setTimeout(function () { fixing = false; }, 0); }
        };
        fix(); if (window.MutationObserver) new MutationObserver(fix).observe(sel, { childList: true, subtree: true, characterData: true });
        var m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/); if (m) lbl.textContent = NAMES[decodeURIComponent(m[1])] || m[1].toUpperCase();
        sel.addEventListener('change', function () {
          if (!sel.value) return restore();
          lbl.textContent = NAMES[sel.value] || sel.value.toUpperCase();
        });
      };
      wire();
    } catch (e) { tr.hidden = true; }
  };
  var s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=mnTranslateInit';
  s.async = true;
  s.onerror = function () { tr.hidden = true; };
  document.head.appendChild(s);
})();
