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
  var targets = Array.prototype.slice.call(document.querySelectorAll('main a, main summary, main label, footer a'));
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
})();
