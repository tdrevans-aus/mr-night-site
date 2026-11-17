/* Mr Night website. Reads content/site.json and fills the page.
   Night edits content/site.json with Pages CMS. No build step. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function str(v) { return v == null ? '' : String(v).trim(); }
  function has(v) { return str(v) !== ''; }
  function get(o, path) {
    return path.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o);
  }
  /* Only real https:// links are used. Anything else counts as empty. */
  function safeUrl(u) {
    u = str(u);
    if (!/^https:\/\/[^\s"'<>]+$/i.test(u)) return '';
    return esc(u);
  }
  /* Image paths from Pages CMS look like /images/photo.jpg. Allow site paths and https only. */
  function safeImg(u) {
    u = str(u);
    if (/^https:\/\/[^\s"'<>()]+$/i.test(u)) return u;
    if (/^\/?[A-Za-z0-9_\-\/.]+\.(jpe?g|png|webp|gif|avif)$/i.test(u) && u.indexOf('..') === -1) return u;
    return '';
  }

  var PHOTO_LABELS = {
    night: 'PHOTO: Mr Night (portrait)',
    van_outside: 'PHOTO: Mr Night\u2019s Toyota Alphard (outside)',
    van_inside: 'PHOTO: Alphard interior',
    van_seats: 'PHOTO: Alphard interior \u2013 massage seats',
    guests: 'PHOTO: Mr Night with his guests'
  };
  var PHOTO_ALT = {
    night: 'Mr Night, private driver in Siem Reap',
    van_outside: 'Mr Night\u2019s Toyota Alphard luxury van',
    van_inside: 'Inside Mr Night\u2019s Toyota Alphard',
    van_seats: 'Reclining massage seats in Mr Night\u2019s van',
    guests: 'Mr Night with his guests'
  };

  function waLink(C, text) {
    var n = str(C.whatsapp).replace(/[^0-9]/g, '') || '85517843878';
    return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function waIcon() { return '<svg class="wa-ico" aria-hidden="true"><use href="#wa"/></svg>'; }

  function priceHtml(C, price, opts) {
    opts = opts || {};
    if (has(price)) {
      return '<div class="price">' + (opts.from ? '<span class="from">from</span> ' : '') +
        '<span class="amt">' + esc(str(C.currency) || 'US$') + esc(price) + '</span>' +
        '<span class="per">' + esc(opts.per || 'per van') + '</span></div>';
    }
    return '<div class="price price-ask"><span class="ask-txt">Message me for price</span></div>';
  }

  function render(C) {
    var name = str(C.name) || 'Mr Night';

    /* ---- simple text fields ---- */
    $$('[data-c]').forEach(function (el) {
      var v = get(C, el.getAttribute('data-c'));
      if (has(v)) el.textContent = str(v);
    });
    /* ---- on/off sections ---- */
    $$('[data-if]').forEach(function (el) {
      if (get(C, el.getAttribute('data-if')) !== true) el.hidden = true;
    });

    /* ---- SEO ---- */
    if (C.seo) {
      if (has(C.seo.title)) document.title = str(C.seo.title);
      if (has(C.seo.description)) { var md = $('meta[name=description]'); if (md) md.setAttribute('content', str(C.seo.description)); }
    }

    /* ---- hero title with highlighted words ---- */
    var h = C.hero || {};
    if (has(h.title)) {
      var t = esc(h.title), hl = str(h.highlight);
      if (hl && str(h.title).indexOf(hl) > -1) t = t.replace(esc(hl), '<em>' + esc(hl) + '</em>');
      $('#hero-title').innerHTML = t;
    }

    /* ---- WhatsApp links ---- */
    $$('[data-wa]').forEach(function (a) { a.href = waLink(C, str(get(C, a.getAttribute('data-wa')))); a.target = '_blank'; a.rel = 'noopener'; });
    $$('[data-wa-text]').forEach(function (a) { a.href = waLink(C, a.getAttribute('data-wa-text').replace(/Mr Night/g, name)); a.target = '_blank'; a.rel = 'noopener'; });
    var phone = str(C.phone_display);
    var tel = 'tel:+' + str(C.whatsapp).replace(/[^0-9]/g, '');
    if ($('#tel')) { $('#tel').href = tel; if (phone) $('#tel').textContent = phone; }

    var V = C.vehicle || {};
    var seats = str(V.seats);
    var model = str(V.model) || 'Toyota Alphard';
    if (seats) $('#hero-seats-lbl').textContent = 'Up to ' + seats + ' people';

    /* ---- photos: real photo if Night uploaded one, otherwise a labelled grey box ---- */
    var P = C.photos || {};
    $$('[data-photo]').forEach(function (el) {
      var key = el.getAttribute('data-photo'), src = safeImg(P[key]);
      el.classList.add('ph');
      el.setAttribute('role', 'img');
      if (src) {
        el.style.backgroundImage = 'url("' + src.replace(/"/g, '') + '")';
        el.setAttribute('aria-label', PHOTO_ALT[key] || name);
      } else {
        el.classList.add('photo-slot');
        el.setAttribute('aria-label', (PHOTO_LABELS[key] || 'Photo') + ' (photo coming soon)');
        el.insertAdjacentHTML('afterbegin', '<span class="slot-lbl">' + esc(PHOTO_LABELS[key] || 'PHOTO') + '</span>');
      }
    });
    var av = safeImg(P.night);
    if (av) $('#jc-av').style.backgroundImage = 'url("' + av.replace(/"/g, '') + '")';
    else $('#jc-av').textContent = name.replace(/^Mr\.?\s*/i, '').charAt(0).toUpperCase() || 'N';
    $('#jc-sub').textContent = 'Luxury van' + (has(C.reply_time) ? ' \u00b7 usually replies in ' + str(C.reply_time) : ' \u00b7 Siem Reap');

    /* ---- trust row ---- */
    var B = C.book_now_pay_later || {};
    var trust = [
      ['van', 'Private ' + model, 'A luxury van just for you.'],
      ['seat', 'Reclining massage seats', 'Rest your legs between temples.'],
      ['drop', 'Cold water & cold towels', 'Ready after every stop, with cool air-con.']
    ];
    if (B.show === true && B.confirmed === true) trust.push(['card', 'Book now, pay later', str(B.text) || 'Pay on the day.']);
    trust.push(['tag', 'Price per van', 'Not per person.' + (seats ? ' Up to ' + seats + ' people.' : '')]);
    var tb = $('#trust-bar');
    tb.style.setProperty('--n', trust.length);
    tb.innerHTML = trust.map(function (i) {
      return '<div class="it"><span class="ico" aria-hidden="true"><svg><use href="#' + i[0] + '"/></svg></span><span><h3 class="h4">' + esc(i[1]) + '</h3><p>' + esc(i[2]) + '</p></span></div>';
    }).join('');

    /* ---- trips ---- */
    var T = C.trips || {};
    $('#feat').innerHTML = (T.featured || []).filter(function (f) { return has(f.title); }).map(function (f) {
      var img = safeImg(f.image), hl = f.highlight === true;
      var photo = img
        ? '<div class="photo" style="background-image:url(\'' + img + '\')" role="img" aria-label="' + esc(f.title) + '">'
        : '<div class="photo ph photo-slot" role="img" aria-label="Photo coming soon: ' + esc(f.title) + '"><span class="slot-lbl">PHOTO: ' + esc(f.title) + '</span>';
      photo += (has(f.kicker) ? '<span class="kicker">' + esc(f.kicker) + '</span>' : '') + '</div>';
      var quote = has(f.quote) ? '<blockquote class="fq">\u201c' + esc(f.quote) + '\u201d<cite>\u2014 ' + esc(name) + '</cite></blockquote>' : '';
      return '<article class="fcard' + (hl ? ' fcard-hl' : '') + '">' + photo +
        '<div class="body">' + (hl ? '<span class="hl-tag">Most loved</span>' : '') + '<h3>' + esc(f.title) + '</h3>' + quote + '<p>' + esc(f.text) + '</p>' +
        (has(f.note) ? '<p class="fnote">' + esc(f.note) + '</p>' : '') +
        '<div class="row">' + priceHtml(C, f.price, { from: f.from === true }) +
        '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + esc(waLink(C, str(f.message).replace(/Mr Night/g, name))) + '">' + waIcon() + (has(f.price) ? 'Book' : 'Ask') + '</a></div></div></article>';
    }).join('');
    var rows = (T.list || []).map(function (r) {
      var p = has(r.price) ? esc(str(C.currency) || 'US$') + esc(r.price) : '<span class="ask-txt">Message me for price</span>';
      return '<div class="r"><div><b>' + esc(r.name) + '</b><small>' + esc(r.details) + '</small></div><div class="p" data-car="Per van">' + p + '</div>' +
        '<a class="ask" target="_blank" rel="noopener" href="' + esc(waLink(C, str(r.message))) + '">' + waIcon() + 'Ask</a></div>';
    }).join('');
    var note = (has(T.included) ? '<span><b>Included:</b> ' + esc(T.included) + '</span>' : '') +
      (has(T.not_included) ? '<span><b>Not included:</b> ' + esc(T.not_included) + '</span>' : '');
    $('#ptable').innerHTML = rows ? '<div class="h"><span>Trip</span><span>Price per van' + (seats ? '<small>up to ' + esc(seats) + ' people</small>' : '') + '</span><span></span></div>' + rows + (note ? '<div class="pnote">' + note + '</div>' : '') : '';
    var G = C.guide || {};
    if (has(G.price)) $('#guide-price').textContent = 'Guide price: ' + (str(C.currency) || 'US$') + str(G.price) + ' per day.';

    /* ---- van features ---- */
    var feats = [
      ['Reclining massage seats', has(V.massage_seats) ? str(V.massage_seats) : 'Rest between temples'],
      [seats ? 'Up to ' + seats + ' people' : 'Room for your group', 'Room for bags too'],
      ['Strong air-con', 'Cool before you get in'],
      ['Cold water & towels', 'After every stop']
    ];
    $('#van-feats').innerHTML = feats.map(function (f) { return '<li><b>' + esc(f[0]) + '</b>' + esc(f[1]) + '</li>'; }).join('');

    /* ---- about ---- */
    var A = C.about || {};
    $('#story').innerHTML = (A.story || []).filter(has).map(function (p, i) { return '<p' + (i === 0 ? ' class="drop"' : '') + '>' + esc(p) + '</p>'; }).join('');
    if (has(A.quote)) { var q = $('#quote'); q.innerHTML = '\u201c' + esc(A.quote) + '\u201d<cite>\u2014 ' + esc(name) + '</cite>'; q.hidden = false; }
    var why = (A.why || []).filter(has).slice();
    if (B.show === true && B.confirmed === true) why.push('Book now, pay later.');
    $('#why').innerHTML = why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('');
    var band = [];
    if (has(A.driving_since)) band.push(['Driving since', A.driving_since, '']);
    if (has(A.languages)) band.push(['Languages', A.languages, '']);
    if (has(A.licence)) band.push(['Licence', A.licence, '']);
    band.push(['My van', model, seats ? seats + ' seats' : 'Reclining massage seats']);
    var tbd = $('#tband');
    if (band.length < 2) { tbd.hidden = true; }
    tbd.style.gridTemplateColumns = 'repeat(' + band.length + ',1fr)';
    tbd.classList.add('n' + band.length);
    tbd.innerHTML = band.map(function (b) { return '<div><small>' + esc(b[0]) + '</small><b>' + esc(b[1]) + '</b>' + (b[2] ? '<span>' + esc(b[2]) + '</span>' : '') + '</div>'; }).join('');

    /* ---- Bangkok + border ---- */
    var K = C.bangkok || {};
    var D = C.border || {};
    if (has(D.date)) $('#border-date').textContent = ' \u2014 ' + str(D.date);
    function days(list) { return (list || []).map(function (d, i) { return '<li data-d="' + (i + 1) + '"><b>' + esc(d.title) + '</b><span>' + esc(d.text) + '</span></li>'; }).join(''); }
    $('#days3').innerHTML = days(K.days_3d);
    $('#days4').innerHTML = days(K.days_4d);
    function pk(p) { return has(p) ? 'From <b>' + esc(str(C.currency) || 'US$') + esc(p) + '</b> per person' : '<span class="ask-txt">Message me for price</span>'; }
    $('#price3').innerHTML = pk(K.price_3d);
    $('#price4').innerHTML = pk(K.price_4d);

    /* ---- places ---- */
    $('#gal').innerHTML = (C.places || []).map(function (p) {
      var img = safeImg(p.image);
      return '<div' + (img ? ' style="background-image:url(\'' + img + '\')"' : '') + ' role="img" aria-label="' + esc(p.name) + '"><span class="cap">' + esc(p.name) + '</span></div>';
    }).join('');

    /* ---- FAQ ---- */
    if (has(C.reply_time)) $('#faq-reply').textContent = ' I usually reply within ' + str(C.reply_time) + '.';
    $('#faq-list').innerHTML = (C.faq || []).filter(function (f) { return has(f.q) && has(f.a); }).map(function (f, i) {
      return '<details class="qa"' + (i < 2 ? ' open' : '') + '><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
    }).join('');

    /* ---- contact / footer ---- */
    var maps = safeUrl(C.google_maps_url);
    if (maps) { var mb = $('#maps-btn'); mb.href = str(C.google_maps_url); mb.target = '_blank'; mb.rel = 'noopener'; mb.hidden = false; }
    var fc = 'WhatsApp: <a href="' + esc(waLink(C, '')) + '" target="_blank" rel="noopener">' + esc(phone || '+' + str(C.whatsapp)) + '</a>';
    if (has(C.email) && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(str(C.email))) fc += '<br>Email: <a href="mailto:' + esc(C.email) + '">' + esc(C.email) + '</a>';
    var links = [];
    if (maps) links.push('<a href="' + maps + '" target="_blank" rel="noopener">Google Maps</a>');
    if (safeUrl(C.facebook_url)) links.push('<a href="' + safeUrl(C.facebook_url) + '" target="_blank" rel="noopener">Facebook</a>');
    if (links.length) fc += '<br>' + links.join(' \u00b7 ');
    $('#foot-contact').innerHTML = fc;
    if (has(C.last_updated)) $('#foot-disc').textContent += ' Last updated ' + str(C.last_updated) + '.';

    renderReviews(C);
    widget(C);
  }

  /* ================= Reviews: everything OFF unless switched on with real links ================= */
  var NAMES = { tripadvisor: 'TripAdvisor', google: 'Google', getyourguide: 'GetYourGuide', booking: 'Booking.com' };
  var LOGO = {
    tripadvisor: '<span class="logo ta" aria-hidden="true"><span><i></i><i></i></span></span>',
    google: '<span class="logo g" aria-hidden="true"><b>G</b></span>',
    getyourguide: '<span class="logo gyg" aria-hidden="true">GYG</span>',
    booking: '<span class="logo bk" aria-hidden="true">B.</span>'
  };
  function okRating(r) { return /^\d{1,2}([.,]\d{1,2})?$/.test(str(r && r.rating)) && /^\d{1,6}$/.test(str(r && r.count).replace(/[,\s]/g, '')); }
  function taId(r) { var id = str(r && r.widget_location_id); return /^\d{3,12}$/.test(id) ? id : ''; }

  function renderReviews(C) {
    var R = C.reviews || {};
    var on = Object.keys(NAMES).filter(function (k) {
      var r = R[k];
      if (!r || r.show !== true || !safeUrl(r.url)) return false;
      if (k === 'google') return okRating(r); /* Google: hand-typed rating + count required */
      return true;
    });
    if (on.length) {
      var html = on.map(function (k) {
        var r = R[k], url = safeUrl(r.url);
        if (k === 'tripadvisor' && taId(r)) {
          /* TripAdvisor's free live rating widget (iframe form, safe to add after page load) */
          return '<div class="badge badge-ta"><iframe title="TripAdvisor rating for ' + esc(C.name || 'Mr Night') + '" loading="lazy" src="https://www.tripadvisor.com/WidgetEmbed-cdsratingsonlynarrow?locationId=' + taId(r) + '&lang=en_US&border=true&display_version=2&format=inner&display=true" width="180" height="110" frameborder="0" scrolling="no"></iframe></div>';
        }
        var score = okRating(r)
          ? '<span class="s">' + esc(r.rating) + (k === 'booking' ? ' / 10' : ' <span class="stars" aria-hidden="true">\u2605</span>') + '</span><span class="t">' + esc(r.count) + ' reviews</span>'
          : '<span class="s">Read my reviews</span>';
        return '<a class="badge" href="' + url + '" target="_blank" rel="noopener">' + LOGO[k] + '<span><span class="t">' + NAMES[k] + '</span>' + score + '</span></a>';
      }).join('');
      var bar = $('#rb-bar');
      bar.innerHTML = html;
      bar.style.gridTemplateColumns = 'repeat(' + on.length + ',1fr)';
      $('#review-badges').hidden = false;
      var ap = $('#about-proof');
      ap.innerHTML = '<div class="bar proofbar" style="grid-template-columns:repeat(' + on.length + ',1fr)">' + html + '</div>';
      ap.hidden = false;
    }
    var AW = C.award || {};
    if (AW.show === true && safeUrl(AW.url) && has(AW.title)) {
      var ap2 = $('#about-proof');
      ap2.insertAdjacentHTML('beforeend', '<p class="award"><a href="' + safeUrl(AW.url) + '" target="_blank" rel="noopener"><b>\ud83c\udfc6 ' + esc(AW.title) + '</b></a></p>');
      ap2.hidden = false;
    }
    var W = C.reviewsWall || {};
    if (W.show === true) {
      var ta = R.tripadvisor || {};
      var live = (ta.show === true && safeUrl(ta.url) && taId(ta))
        ? '<div class="ta-live"><iframe title="Latest TripAdvisor reviews" loading="lazy" src="https://www.tripadvisor.com/WidgetEmbed-selfserveprop?locationId=' + taId(ta) + '&lang=en_US&rating=true&nreviews=5&writereviewlink=true&popIdx=true&iswide=true&border=true&display_version=2&format=inner&display=true" width="100%" height="420" frameborder="0"></iframe></div>'
        : '';
      var items = (W.items || []).filter(function (i) { return has(i.text) && safeUrl(i.url); });
      if (live || items.length) {
        $('#rw-live').innerHTML = live;
        $('#rw-wall').innerHTML = items.map(function (i) {
          var src = NAMES[i.source] ? i.source : '';
          return '<div class="rev">' + (src ? '<span class="src">' + LOGO[src] + '</span>' : '') +
            '<div class="who"><span class="av" style="background:#b4532a" aria-hidden="true">' + esc((str(i.name) || '?').charAt(0)) + '</span><span><b>' + esc(i.name) + '</b><small>' +
            esc([str(i.country), str(i.date)].filter(Boolean).join(' \u00b7 ')) + '</small></span></div><p>' + esc(i.text) + '</p>' +
            '<p class="rev-link"><a href="' + safeUrl(i.url) + '" target="_blank" rel="noopener">Read on ' + (NAMES[src] || 'the review site') + '</a></p></div>';
        }).join('');
        $('#reviews').hidden = false;
      }
    }
  }

  /* ================= Floating WhatsApp widget (Join.chat style) ================= */
  function widget(C) {
    var jc = $('#jc'), jb = $('#jcbtn'), box = $('.jc-box', jc);
    var msg = str((C.widget || {}).message) || 'Hi ' + (C.name || 'Mr Night') + ', I found your website. I would like to ask about a trip.';
    jb.href = waLink(C, msg);
    function toggle(open) {
      jc.classList.toggle('open', open);
      box.setAttribute('aria-hidden', open ? 'false' : 'true');
      jb.setAttribute('aria-label', open ? 'Open WhatsApp chat with ' + (C.name || 'Mr Night') : 'Chat with ' + (C.name || 'Mr Night') + ' on WhatsApp');
      if (open) jc.classList.remove('has-badge');
    }
    jb.addEventListener('click', function (e) {
      if (!jc.classList.contains('open')) { e.preventDefault(); toggle(true); }
      else { jb.target = '_blank'; jb.rel = 'noopener'; }
    });
    $('.jc-close', jc).addEventListener('click', function () { toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
    var q = new URLSearchParams(location.search).get('chat');
    setTimeout(function () { jc.classList.add('show'); }, q ? 0 : 3000);
    setTimeout(function () { jc.classList.add('has-badge'); }, q ? 0 : 6000);
    if (q === 'open') toggle(true);
    window.mrNightChat = toggle;
  }

  /* ================= Load content ================= */
  fetch('content/site.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('content ' + r.status); return r.json(); })
    .then(function (C) { render(C); document.documentElement.classList.add('ready'); })
    .catch(function (e) {
      /* If the content file cannot load, the page still shows the built-in text and the WhatsApp links work. */
      if (window.console) console.warn('Could not load content/site.json', e);
      document.documentElement.classList.add('ready');
      widget({ whatsapp: '85517843878', name: 'Mr Night' });
    });
})();
