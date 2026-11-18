/* Mr Night website renderer. Turns content/site.json into finished HTML.
   Used by build.js (node build.js -> dist/). No dependencies. */
'use strict';

function str(v) { return v == null ? '' : String(v).trim(); }

/* Placeholders: any [bracketed text] is an editor note. Strip it; if nothing
   meaningful is left, the value counts as empty (and is hidden on the page). */
function clean(v) {
  var s = str(v);
  if (s.indexOf('[') === -1) return s;
  s = s.replace(/\[[^\]]*\](?!\()/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s·,;:\-–—|]+|[\s·,;:\-–—|]+$/g, '')
    .trim();
  return /[A-Za-z0-9\u0E00-\u0E7F\u1780-\u17FF]/.test(s) ? s : '';
}
/* Apply clean() to every string in the content. */
function cleanAll(o) {
  if (typeof o === 'string') return clean(o);
  if (Array.isArray(o)) return o.map(cleanAll);
  if (o && typeof o === 'object') { var r = {}; Object.keys(o).forEach(function (k) { r[k] = cleanAll(o[k]); }); return r; }
  return o;
}
function has(v) { return str(v) !== ''; }
function esc(s) {
  return str(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
/* Links inside text fields. Text is escaped first; then only these become links:
   [text](https://...), [text](mailto:...), [text](tel:...), bare https:// or http:// addresses,
   bare domains like example.com / angkorenterprise.gov.kh, and email addresses.
   Anything else (javascript:, data:, ...) is never linked: a bad markdown link shows its text only. */
var LINK_RE = /\[([^\[\]]{1,200})\]\(([^()\s]{1,500})\)|\b(https?:\/\/[^\s<>"'()\[\]]+)|\b([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})\b|\b((?:www\.)?(?:[A-Za-z0-9-]+\.)+(?:com|org|net|info|io|co|uk|kh|th|gov|edu|travel|asia)\b(?:\/[^\s<>"'()\[\]]*)?)/gi;
function linkHref(u) {
  u = str(u);
  if (/^https?:\/\/[^\s"'<>]+$/i.test(u)) return u;
  if (/^mailto:[^\s"'<>:\/]+@[^\s"'<>]+$/i.test(u)) return u;
  if (/^tel:\+?[0-9 ()\-]{3,20}$/i.test(u)) return u;
  return '';
}
function anchor(href, label) {
  var ext = /^https?:/i.test(href) && !/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href);
  return '<a href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(label) + '</a>';
}
function rich(v) {
  var s = str(v), out = '', last = 0, m;
  var esc = function (x) { return String(x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(s))) {
    var raw = m[0], label, href, tail = '';
    if (m[1] !== undefined) { label = m[1]; href = linkHref(m[2]); }
    else if (m[3]) { var t = m[3].match(/[.,;:!?]+$/); if (t) { tail = t[0]; raw = raw.slice(0, -tail.length); } label = raw; href = linkHref(raw); }
    else if (m[4]) { label = m[4]; href = linkHref('mailto:' + m[4]); }
    else { var t2 = m[5].match(/[.,;:!?]+$/); if (t2) { tail = t2[0]; raw = raw.slice(0, -tail.length); } label = raw; href = linkHref('https://' + raw.replace(/^\/+/, '') + (raw.indexOf('/') === -1 ? '/' : '')); }
    out += esc(s.slice(last, m.index)) + (href ? anchor(href, label) : esc(label)) + esc(tail);
    last = m.index + m[0].length;
  }
  return out + esc(s.slice(last));
}
function safeUrl(u) { u = str(u); return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
function safeImg(u) {
  u = str(u);
  if (/^https:\/\/[^\s"'<>()]+$/i.test(u)) return u;
  if (/^\/?[A-Za-z0-9_\-\/.]+\.(jpe?g|png|webp|gif|avif)$/i.test(u) && u.indexOf('..') === -1) return u.replace(/^\//, '');
  return '';
}
function baseUrl(C) { var b = safeUrl(C.base_url) || 'https://mrnight-tourguide.pages.dev'; return b.replace(/\/+$/, '') + '/'; }

var PHOTO_ALT = {
  night: 'Mr Night, private driver and licensed guide in Siem Reap',
  headshot: 'Mr Night',
  van_outside: 'Mr Night\u2019s Toyota Alphard luxury van',
  van_inside: 'Inside Mr Night\u2019s Toyota Alphard',
  van_seats: 'Comfortable reclining seats in Mr Night\u2019s van',
  van_about: 'Mr Night\u2019s white Toyota Alphard',
  guests2: 'Mr Night at Angkor Wat',
  guests: 'Mr Night with his guests'
};
var NAMES = { tripadvisor: 'TripAdvisor', google: 'Google', getyourguide: 'GetYourGuide', booking: 'Booking.com' };
var LOGO = {
  tripadvisor: '<span class="logo ta" aria-hidden="true"><span><i></i><i></i></span></span>',
  google: '<span class="logo g" aria-hidden="true"><b>G</b></span>',
  getyourguide: '<span class="logo gyg" aria-hidden="true">GYG</span>',
  booking: '<span class="logo bk" aria-hidden="true">B.</span>'
};

/* Brand text for the logo: keeps "Tour Guide" together when the name wraps on small screens. */
function brandHtml(b) {
  var m = String(b).match(/^(.+?)\s+([-\u2013\u2014|\u00b7])\s+(.+)$/);
  if (!m) return esc(b);
  return '<span class="nw">' + esc(m[1]) + ' ' + esc(m[2]) + '</span> <span class="nw">' + esc(m[3]) + '</span>';
}

function render(raw, opts) {
  opts = opts || {};
  var C = cleanAll(raw);
  var name = str(C.name) || 'Mr Night';
  var brandName = str(C.brand) || name;
  var cur = str(C.currency) || 'US$';
  var num = str(C.whatsapp).replace(/[^0-9]/g, '') || '85517843878';
  var phone = str(C.phone_display) || '+' + num;
  var V = C.vehicle || {};
  var seats = str(V.seats);
  var capacity = str(V.capacity) || (seats ? 'up to ' + seats + ' guests' : '');
  var Capacity = capacity ? capacity.charAt(0).toUpperCase() + capacity.slice(1) : '';
  var luggage = str(V.luggage_note);
  var model = str(V.model) || 'Toyota Alphard';
  var P = C.photos || {};
  var BASE = baseUrl(C);
  var withName = function (t) { return str(t).replace(/Mr Night/g, name); };

  function wa(text) { return 'https://wa.me/' + num + (has(text) ? '?text=' + encodeURIComponent(withName(text)) : ''); }
  var ICON = '<svg class="wa-ico" aria-hidden="true"><use href="#wa"/></svg>';
  function waBtn(cls, text, label) {
    return '<a class="' + cls + '" href="' + esc(wa(text)) + '" target="_blank" rel="noopener noreferrer">' + ICON + label + '</a>';
  }
  /* Responsive picture: WebP srcset when build.js found resized copies (name-800w.webp), plain image otherwise. */
  var variants = opts.variants || function () { return []; };
  /* Per-photo crop focus from site.json photo_positions: [{ image: "van-outside.jpg", position: "50% 60%" }] */
  var POS = {};
  (Array.isArray(C.photo_positions) ? C.photo_positions : []).forEach(function (x) { var k = str(x && x.image).split('/').pop(), v = str(x && x.position); if (k && /^[0-9.]+% [0-9.]+%$/.test(v)) POS[k] = v; });
  function posOf(src) { return POS[String(src || '').split('/').pop()] || ''; }
  function pic(src, alt, sizes, cls) {
    var pos = posOf(src);
    var v = variants(src), img = '<img class="' + (cls || 'pimg') + '" src="' + esc(src) + '" alt="' + esc(alt) + '"' + (pos ? ' style="object-position:' + pos + '"' : '') + ' loading="lazy" decoding="async">';
    if (!v.length) return img;
    return '<picture><source type="image/webp" srcset="' + esc(v.map(function (x) { return x.u + ' ' + x.w + 'w'; }).join(', ')) + '" sizes="' + esc(sizes || '100vw') + '">' + img + '</picture>';
  }
  /* A photo slot. Empty slots are left out of the page (no grey boxes, no "PHOTO:" labels). */
  function photo(key, cls, extra, sizes) {
    var src = safeImg(P[key]);
    if (!src) return '';
    return '<div class="' + (cls ? cls + ' ' : '') + 'ph has-img">' + pic(src, PHOTO_ALT[key], sizes) + (extra || '') + '</div>';
  }
  /* Translate menu (Google Website Translator). Hidden until Google's script loads (site.js), so no-JS and blocked-script visitors see nothing. */
  var TRN = C.translate || {};
  var trLangs = str(TRN.languages).replace(/\s+/g, '');
  if (!/^[A-Za-z]{2,3}(-[A-Za-z]{2,4})?(,[A-Za-z]{2,3}(-[A-Za-z]{2,4})?)*$/.test(trLangs)) trLangs = '';
  function translateMenu() {
    if (TRN.show !== true || !trLangs) return '';
    return '<div class="tr notranslate" id="tr" translate="no" hidden data-langs="' + esc(trLangs) + '"><svg class="tr-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2.8 12h18.4M12 2.8c2.6 2.6 3.9 5.6 3.9 9.2s-1.3 6.6-3.9 9.2M12 2.8C9.4 5.4 8.1 8.4 8.1 12s1.3 6.6 3.9 9.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span class="tr-lbl">EN</span><span class="sr">' + esc(str(TRN.label) || 'Translate this page') + '</span><div id="google_translate_element"></div></div>';
  }
  var headshot = safeImg(P.headshot) || safeImg(P.night);
  /* Photo with its caption BELOW the image (never on top of it). */
  function fig(key, cls, cap, sizes) {
    var src = safeImg(P[key]);
    if (!src) return '';
    return '<figure class="pf ' + (cls || '') + '"><div class="pf-img">' + pic(src, PHOTO_ALT[key] || name, sizes) + '</div>' + (cap ? '<figcaption>' + cap + '</figcaption>' : '') + '</figure>';
  }
  function avatar(cls, sizes) { return headshot ? '<span class="' + cls + '">' + pic(headshot, name, sizes || '96px', 'avimg') + '</span>' : ''; }
  function price(p, o) {
    o = o || {};
    if (has(p)) return '<div class="price">' + (o.from ? '<span class="from">from</span> ' : '') + '<span class="amt">' + esc(cur) + esc(p) + '</span><span class="per">' + esc(o.per || 'per van') + '</span></div>';
    return '<div class="price price-ask"><span class="ask-txt">Message me for price</span></div>';
  }
  function T(path, fallback) {
    var v = path.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, C);
    return has(v) ? str(v) : (fallback || '');
  }

  /* ---------- head ---------- */
  var email = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(str(C.email)) ? str(C.email) : '';
  var title = T('seo.title', brandName + ' \u00b7 Private Driver & Licensed Guide in Siem Reap');
  var desc = T('seo.description', name + ' \u2013 private luxury van with driver in Siem Reap, Cambodia.');
  var ogImg = BASE + 'images/og-image.jpg';
  var head = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<title>' + esc(title) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n' +
    '<link rel="canonical" href="' + esc(BASE) + '">\n<meta name="theme-color" content="#10292c">\n' +
    '<meta property="og:type" content="website">\n<meta property="og:site_name" content="' + esc(brandName) + '">\n<meta name="apple-mobile-web-app-title" content="' + esc(brandName) + '">\n<meta name="application-name" content="' + esc(brandName) + '">\n' +
    '<meta property="og:url" content="' + esc(BASE) + '">\n<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n<meta property="og:image" content="' + esc(ogImg) + '">\n' +
    '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' +
    '<meta property="og:image:alt" content="' + esc(brandName) + ', private driver and licensed guide in Siem Reap">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="' + esc(ogImg) + '">\n' +
    '<link rel="icon" href="favicon.svg" type="image/svg+xml">\n<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Khmer:wght@400;600;700&family=Noto+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="css/style.css">\n' +
    '<script type="application/ld+json">' + JSON.stringify({
      '@context': 'https://schema.org', '@type': 'LocalBusiness', name: brandName, alternateName: [name, str(C.full_name)].filter(function (x, i, a) { return x && x !== brandName && a.indexOf(x) === i; }), url: BASE, image: ogImg, description: desc,
      telephone: '+' + num, email: email || undefined, address: { '@type': 'PostalAddress', addressLocality: 'Siem Reap', addressCountry: 'KH' }
    }).replace(/</g, '\\u003c') + '</script>\n</head>\n';

  var brand = function (style) {
    return '<a class="brand" href="#top"' + (style ? ' style="' + style + '"' : '') + '><span class="moon" aria-hidden="true"></span><span><b class="notranslate" translate="no">' + brandHtml(brandName) + '</b>' +
      (has(C.tagline) ? '<small>' + esc(C.tagline) + '</small>' : '') + '</span></a>';
  };
  var K = C.bangkok || {};
  var showBkk = K.show === true;
  var FI = C.flying_in || {};
  var showFly = FI.show === true && has(FI.heading);

  /* Hero pair: Night first (bigger), his van second (smaller). Captions sit under the photos, never on them. */
  function heroPics() {
    var nm = safeImg(P.night) ? 'night' : (safeImg(P.headshot) ? 'headshot' : '');
    var vk = safeImg(P.van_outside) ? 'van_outside' : (safeImg(P.van_about) ? 'van_about' : '');
    if (!nm && !vk) return '';
    function fig(key, cls, cap, sizes) { var src = safeImg(P[key]); return '<figure class="' + cls + '"><div class="hp-img">' + pic(src, PHOTO_ALT[key] || name, sizes) + '</div><figcaption>' + cap + '</figcaption></figure>'; }
    return '<div class="hpair' + (nm && vk ? '' : ' hpair-one') + '">' +
      (nm ? fig(nm, 'hp-main', '<span translate="no" class="notranslate">' + esc(name) + '</span>', '(max-width: 960px) 52vw, 320px') : '') +
      (vk ? fig(vk, 'hp-van', 'My ' + esc(model) + (capacity ? ' \u00b7 ' + esc(capacity) : ''), '(max-width: 960px) 40vw, 240px') : '') + '</div>';
  }
  /* ---------- header + hero ---------- */
  var H = C.hero || {};
  var heroTitle = esc(T('hero.title', 'Your private luxury van in Siem Reap.'));
  var hl = str(H.highlight);
  if (hl && heroTitle.indexOf(esc(hl)) > -1) heroTitle = heroTitle.replace(esc(hl), '<em>' + esc(hl) + '</em>');
  var out = head + '<body>\n<a class="skip" href="#main">Skip to content</a>\n' + opts.icons +
    '<header class="top"><div class="wrap">' + brand() +
    '<nav class="nav" aria-label="Main"><a href="#trips">Favourites</a><a href="#transfers">All trips</a><a href="#van">The van</a><a href="#about">About me</a>' +
    (showFly ? '<a href="#flying-in">Flying in</a>' : '') + (showBkk ? '<a href="#bangkok">From Bangkok</a>' : '') + '<a href="#faq">FAQ</a>' +
    translateMenu() + waBtn('btn btn-wa btn-sm', T('widget.message'), '<span translate="no" class="notranslate">WhatsApp</span>') + '</nav></div></header>\n<main id="main">\n';

  out += '<section class="hero" id="top"><div class="bg" role="img" aria-label="Angkor Wat at sunrise"></div><div class="wrap"><div>' +
    (has(H.eyebrow) ? '<p class="eyebrow">' + esc(H.eyebrow) + '</p>' : '') +
    '<h1>' + heroTitle + '</h1>' + (has(H.text) ? '<p class="lead">' + rich(H.text) + '</p>' : '') +
    '<div class="ctas">' + waBtn('btn btn-wa', H.message, esc(T('hero.button', 'Message ' + name + ' on WhatsApp'))) +
    '<a class="btn btn-ghost" href="#trips">See trips <svg class="wa-ico" aria-hidden="true"><use href="#arrow"/></svg></a></div></div>' +
    heroPics() + '</div></section>\n';

  /* ---------- trust row ---------- */
  var B = C.book_now_pay_later || {};
  var bnpl = B.show === true && B.confirmed === true;
  var trust = [['i-van', 'Private ' + model, 'A luxury van just for you.'], ['seat', 'Reclining massage seats', 'Rest your legs between temples.'], ['drop', 'Cold water', 'Ready after every stop, with cool air-con.']];
  if (bnpl) trust.push(['card', 'Book now, pay later', T('book_now_pay_later.text', 'Pay on the day.')]);
  trust.splice(2, 0, ['badge', 'Licensed Siem Reap guide', '15+ years at the Angkor temples.']);
  trust.push(['tag', 'Price per van' + (capacity ? ', ' + capacity : ''), 'Not per person.']);
  out += '<section class="trust2" aria-label="Why book ' + esc(name) + '"><div class="wrap"><ul class="bar" style="--n:' + trust.length + '">' +
    trust.map(function (i) { return '<li class="it"><span class="ico" aria-hidden="true"><svg><use href="#' + i[0] + '"/></svg></span><span><strong class="h4">' + esc(i[1]) + '</strong><span class="it-p">' + esc(i[2]) + '</span></span></li>'; }).join('') +
    '</ul></div></section>\n';

  /* ---------- featured trips ---------- */
  var TR = C.trips || {};
  var cards = (TR.featured || []).map(function (f) {
    var t = has(f.title) ? str(f.title) : str(f.fallback_title);
    if (!t) return '';
    var img = safeImg(f.image), hlc = f.highlight === true;
    var ph = img ? '<div class="photo ph has-img">' + pic(img, t, '(max-width: 760px) 92vw, 300px')
      : '<div class="photo nophoto" aria-hidden="true">';
    ph += '</div>';
    return '<article class="fcard' + (hlc ? ' fcard-hl' : '') + '">' + ph + '<div class="body">' + (hlc ? '<span class="hl-tag">My favourite</span>' : '') + (has(f.kicker) ? '<p class="fkick">' + esc(f.kicker) + '</p>' : '') +
      '<h3>' + esc(t) + '</h3>' + (has(f.quote) ? '<blockquote class="fq">\u201c' + esc(f.quote) + '\u201d<cite>\u2014 ' + esc(name) + '</cite></blockquote>' : '') +
      (has(f.text) ? '<p>' + rich(f.text) + '</p>' : '') + (has(f.note) ? '<p class="fnote">' + rich(f.note) + '</p>' : '') + (f.show_luggage === true && luggage ? '<p class="fnote lug-s">' + rich(luggage) + '</p>' : '') +
      '<div class="row">' + price(f.price, { from: f.from === true }) + waBtn('btn btn-wa btn-sm', f.message || ('Hi Mr Night, I would like: ' + t), has(f.price) ? 'Book' : 'Ask') + '</div></div></article>';
  }).join('');
  out += '<section class="sec featured" id="trips" aria-labelledby="trips-h"><div class="wrap"><div class="sec-head">' +
    '<p class="eyebrow">' + esc(T('trips.featured_eyebrow', 'Featured trips')) + '</p><h2 id="trips-h">' + esc(T('trips.featured_heading', 'My favourite trips')) + '</h2>' +
    (has(TR.featured_intro) ? '<p>' + rich(TR.featured_intro) + '</p>' : '') + '</div><div class="feat">' + cards + '</div></div></section>\n';

  /* ---------- review badges (off by default) ---------- */
  var R = C.reviews || {};
  var okRating = function (r) { return /^\d{1,2}([.,]\d{1,2})?$/.test(str(r && r.rating)) && /^\d{1,6}$/.test(str(r && r.count).replace(/[,\s]/g, '')); };
  var taId = function (r) { var id = str(r && r.widget_location_id); return /^\d{3,12}$/.test(id) ? id : ''; };
  var on = Object.keys(NAMES).filter(function (k) {
    var r = R[k]; if (!r || r.show !== true || !safeUrl(r.url)) return false;
    return k === 'google' ? okRating(r) : true;
  });
  var badges = on.map(function (k) {
    var r = R[k];
    if (k === 'tripadvisor' && taId(r)) return '<div class="badge badge-ta"><iframe title="TripAdvisor rating for ' + esc(name) + '" loading="lazy" src="https://www.tripadvisor.com/WidgetEmbed-cdsratingsonlynarrow?locationId=' + taId(r) + '&amp;lang=en_US&amp;border=true&amp;display_version=2&amp;format=inner&amp;display=true" width="180" height="110" frameborder="0" scrolling="no"></iframe></div>';
    var score = okRating(r) ? '<span class="s">' + esc(r.rating) + (k === 'booking' ? ' / 10' : ' <span class="stars" aria-hidden="true">\u2605</span>') + '</span><span class="t">' + esc(r.count) + ' reviews</span>' : '<span class="s">Read my reviews</span>';
    return '<a class="badge" href="' + esc(safeUrl(r.url)) + '" target="_blank" rel="noopener noreferrer">' + LOGO[k] + '<span><span class="t">' + NAMES[k] + '</span>' + score + '</span></a>';
  }).join('');
  if (on.length) out += '<section class="badges rbadges" id="review-badges" aria-label="Reviews"><div class="wrap"><div class="bar" style="grid-template-columns:repeat(' + on.length + ',1fr)">' + badges + '</div></div></section>\n';

  /* ---------- all trips & prices ---------- */
  var rows = (TR.list || []).filter(function (r) { return has(r.name); }).map(function (r) {
    return '<div class="r"><div><b>' + esc(r.name) + '</b>' + (has(r.details) ? '<small>' + rich(r.details) + '</small>' : '') + '</div><div class="p" data-car="Per van">' +
      (has(r.price) ? esc(cur) + esc(r.price) : '<span class="ask-txt">Message me for price</span>') + '</div>' +
      waBtn('ask', r.message || ('Hi Mr Night, I would like: ' + r.name), 'Ask<span class="sr"> about ' + esc(r.name) + '</span>') + '</div>';
  }).join('');
  var note = (has(TR.included) ? '<span><b>Included:</b> ' + rich(TR.included) + '</span>' : '') + (has(TR.not_included) ? '<span><b>Not included:</b> ' + rich(TR.not_included) + '</span>' : '');
  var G = C.guide || {};
  out += '<section class="sec" id="transfers" aria-labelledby="transfers-h"><div class="wrap"><div class="sec-head"><p class="eyebrow">Airport, temples &amp; city</p>' +
    '<h2 id="transfers-h">' + esc(T('trips.heading', 'All trips')) + '</h2>' + (has(TR.intro) ? '<p>' + rich(TR.intro) + '</p>' : '') + '</div>' +
    (rows ? '<div class="ptable"><div class="h"><span>Trip</span><span>Price per van' + (capacity ? '<small>' + esc(capacity) + '</small>' : '') + '</span><span></span></div>' + rows + (note ? '<div class="pnote">' + note + '</div>' : '') + '</div>' : '') +
    (G.show === true && (has(G.heading) || has(G.text)) ? '<div class="guide"><span class="big" aria-hidden="true"><svg><use href="#badge"/></svg></span><div>' +
      (has(G.heading) ? '<h3>' + esc(G.heading) + '</h3>' : '') + '<p>' + rich(G.text) + '</p></div>' +
      waBtn('btn btn-line btn-sm', 'Hi Mr Night, I would like you to drive and guide me at the temples. Date: ___ People: ___', 'Book a guided day') + '</div>' : '') +
    '</div></section>\n';

  /* ---------- the van ---------- */
  var feats = [['Room to stretch out', has(V.massage_seats) ? V.massage_seats : 'Rest between temples'], [Capacity || 'Room for your group', 'Room for bags too'], ['Strong air-con', 'Cool before you get in'], ['Cold water', 'After every stop']];
  out += '<section class="sec dark" id="van" aria-labelledby="van-h"><div class="wrap comfort"><div class="cgal2">' + fig('van_seats', 'pf-wide', 'Inside: comfortable reclining seats', '(max-width: 960px) 46vw, 270px') + fig('van_inside', 'pf-land', 'Inside the van', '(max-width: 960px) 46vw, 270px') + '</div><div>' +
    '<p class="eyebrow">The van</p><h2 class="van-h" id="van-h">' + esc(T('van.heading', 'Travel in comfort')) + '</h2>' + (has(C.van && C.van.text) ? '<p class="van-p">' + rich(C.van.text) + '</p>' : '') +
    '<ul class="feats">' + feats.map(function (f) { return '<li><b>' + esc(f[0]) + '</b>' + esc(f[1]) + '</li>'; }).join('') + '</ul>' +
    (luggage ? '<p class="lug"><svg class="wa-ico" aria-hidden="true"><use href="#i-van"/></svg>' + rich(luggage) + '</p>' : '') +
    waBtn('btn btn-wa', 'Hi Mr Night, I would like to book your luxury van. Date: ___ People: ___ Trip: ___', esc(T('van.button', 'Book the van'))) + '</div></div></section>\n';

  /* ---------- about ---------- */
  var A = C.about || {};
  var why = (A.why || []).filter(has).slice(); if (bnpl) why.push('Book now, pay later.');
  var band = [];
  if (has(A.driving_since)) band.push(['Driving since', A.driving_since, '']);
  if (has(A.experience)) band.push(['Experience', A.experience, '']);
  if (has(A.languages)) band.push(['Languages', A.languages, '']);
  if (has(A.licence)) band.push(['Licence', A.licence, '']);
  band.push(['My van', model, Capacity || 'Private van']);
  var proof = on.length ? '<div class="bar proofbar" style="grid-template-columns:repeat(' + on.length + ',1fr)">' + badges + '</div>' : '';
  var AW = C.award || {};
  if (AW.show === true && safeUrl(AW.url) && has(AW.title)) proof += '<p class="award"><a href="' + esc(safeUrl(AW.url)) + '" target="_blank" rel="noopener noreferrer"><b>\ud83c\udfc6 ' + esc(AW.title) + '</b></a></p>';
  /* Each photo appears once on the page: the hero already shows Night and the van, the van section shows the seats. */
  var mos = [fig('guests', 'pf-wide', 'With my guests at Angkor Wat', '(max-width: 960px) 92vw, 560px'), fig('guests2', 'pf-wide', 'Me at Angkor Wat', '(max-width: 960px) 92vw, 560px')].filter(Boolean);
  out += '<section class="about" id="about" aria-labelledby="about-h"><div class="wrap"><div class="about-head">' + '<p class="eyebrow">About me</p>' +
    '<h2 id="about-h">' + esc(T('about.heading', name)) + (has(A.subheading) ? '<span class="sr"> – </span><em>' + esc(A.subheading) + '</em>' : '') + '</h2></div>' +
    '<div class="about-grid"><div class="apics">' + mos.join('') + '</div><div class="about-story">' +
    (A.story || []).filter(has).map(function (p, i) { return '<p' + (i === 0 ? ' class="drop"' : '') + '>' + rich(p) + '</p>'; }).join('') +
    ((A.story || []).filter(has).length ? '<p class="signoff"><span class="sig">\u2014 ' + esc(name) + '</span></p>' : '') +
    (has(A.quote) ? '<blockquote class="nq">\u201c' + esc(A.quote) + '\u201d<cite>\u2014 ' + esc(name) + '</cite></blockquote>' : '') +
    (why.length ? '<div class="why"><h3>Why travel with me</h3><ul>' + why.map(function (w) { return '<li>' + rich(w) + '</li>'; }).join('') + '</ul></div>' : '') + '</div></div>' +
    (band.length > 1 ? '<dl class="tband n' + band.length + '" style="grid-template-columns:repeat(' + band.length + ',1fr)">' + band.map(function (b) { return '<div><dt>' + esc(b[0]) + '</dt><dd><b>' + esc(b[1]) + '</b>' + (b[2] ? '<span>' + esc(b[2]) + '</span>' : '') + '</dd></div>'; }).join('') + '</dl>' : '') +
    (proof ? '<div class="aproof" id="about-proof">' + proof + '</div>' : '') +
    '<div class="about-cta">' + waBtn('btn btn-wa', 'Hi Mr Night, I read your story on your website. I would like to travel with you. Dates: ___ People: ___', 'Message ' + esc(name) + ' on WhatsApp') + '</div></div></section>\n';

  /* ---------- reviews wall (off by default) ---------- */
  var W = C.reviewsWall || {};
  if (W.show === true) {
    var ta = R.tripadvisor || {};
    var live = (ta.show === true && safeUrl(ta.url) && taId(ta)) ? '<div class="ta-live"><iframe title="Latest TripAdvisor reviews" loading="lazy" src="https://www.tripadvisor.com/WidgetEmbed-selfserveprop?locationId=' + taId(ta) + '&amp;lang=en_US&amp;rating=true&amp;nreviews=5&amp;writereviewlink=true&amp;popIdx=true&amp;iswide=true&amp;border=true&amp;display_version=2&amp;format=inner&amp;display=true" width="100%" height="420" frameborder="0"></iframe></div>' : '';
    var items = (W.items || []).filter(function (i) { return has(i.text) && safeUrl(i.url); });
    if (live || items.length) {
      out += '<section class="sec revsec" id="reviews" aria-labelledby="rev-h"><div class="wrap"><div class="sec-head center"><p class="eyebrow">Reviews</p><h2 id="rev-h">What guests say</h2><p>Real reviews from my public pages, with a link to each one.</p></div>' + live +
        '<div class="wall">' + items.map(function (i) {
          var src = NAMES[i.source] ? i.source : '';
          return '<div class="rev">' + (src ? '<span class="src">' + LOGO[src] + '</span>' : '') + '<div class="who"><span class="av" aria-hidden="true">' + esc((str(i.name) || '?').charAt(0)) + '</span><span><b>' + esc(i.name) + '</b><small>' +
            esc([str(i.country), str(i.date)].filter(Boolean).join(' \u00b7 ')) + '</small></span></div><p>' + esc(i.text) + '</p><p class="rev-link"><a href="' + esc(safeUrl(i.url)) + '" target="_blank" rel="noopener noreferrer">Read on ' + (NAMES[src] || 'the review site') + '</a></p></div>';
        }).join('') + '</div></div></section>\n';
    }
  }

  /* ---------- coming from Bangkok ---------- */
  /* ---------- flying in (SAI airport) ---------- */
  if (showFly) {
    var flights = str(FI.flights), fiText = str(FI.text);
    fiText = flights ? fiText.replace(/\{flights\}/g, flights) : fiText.replace(/,?[^,.]*\{flights\}/g, '');
    var fiImg = safeImg(FI.image);
    out += '<section class="sec" id="flying-in" aria-labelledby="fly-h"><div class="wrap"><div class="bkk fly' + (fiImg ? '' : ' noimg') + '">' +
      (fiImg ? '<div class="pic ph has-img">' + pic(fiImg, 'Mr Night\u2019s Toyota Alphard at Siem Reap Angkor International Airport (SAI)', '(max-width: 960px) 92vw, 520px') + '</div>' : '') + '<div class="in">' +
      (has(FI.eyebrow) ? '<p class="eyebrow">' + esc(FI.eyebrow) + '</p>' : '') + '<h2 id="fly-h">' + esc(FI.heading) + '</h2>' +
      (has(fiText) ? '<p class="lead">' + rich(fiText) + '</p>' : '') + (FI.show_luggage === true && luggage ? '<p class="lug-s">' + rich(luggage) + '</p>' : '') +
      '<div class="foot">' + waBtn('btn btn-wa', FI.message || 'Hi Mr Night, I am flying into Siem Reap (SAI). My flight number is: ___. Date: ___. Hotel: ___', esc(str(FI.button) || 'Send me your flight number')) + '</div></div></div></div></section>\n';
  }
  if (showBkk) {
    var D = C.border || {};
    var days = function (l) { return (l || []).filter(function (d) { return has(d.title); }).map(function (d, i) { return '<li data-d="' + (i + 1) + '"><b>' + esc(d.title) + '</b>' + (has(d.text) ? '<span>' + esc(d.text) + '</span>' : '') + '</li>'; }).join(''); };
    var pk = function (p) { return has(p) ? '<p class="pkprice">From <b>' + esc(cur) + esc(p) + '</b> per person</p>' : '<p class="pkprice"><span class="ask-txt">Message me for price</span></p>'; };
    var tbc = (K.tbc && K.tbc.show === true && has(K.tbc.text)) ? '<p class="tbc"><span class="tbc-tag">To be confirmed</span> ' + rich(K.tbc.text) + '</p>' : '';
    var PO = K.poipet || {};
    out += '<section class="sec" id="bangkok" aria-labelledby="bkk-h"><div class="wrap"><div class="bkk"><div class="pic" role="img" aria-label="Bayon temple faces"></div><div class="in">' +
      (has(K.eyebrow) ? '<p class="eyebrow">' + esc(K.eyebrow) + '</p>' : '') + '<h2 id="bkk-h">' + esc(T('bangkok.heading', 'Coming from Bangkok?')) + '</h2>' +
      (has(K.text) ? '<p class="lead">' + rich(K.text) + '</p>' : '') +
      (D.show === true && (has(D.note) || has(D.fly_note)) ? '<div class="notice" id="border-note"><span class="dot" aria-hidden="true"></span><div><b>Border update' + (has(D.date) ? ' \u2014 ' + esc(D.date) : '') + '</b><p>' + rich([str(D.note), str(D.fly_note)].filter(Boolean).join(' ')) + '</p></div></div>' : '') +
      '<input type="radio" name="pk" id="t3" checked><input type="radio" name="pk" id="t4">' +
      '<div class="tg" role="group" aria-label="Choose trip length"><label for="t3">3 days \u00b7 2 nights</label><label for="t4">4 days \u00b7 3 nights</label></div>' +
      '<div class="plans"><div class="plan p3"><h3 class="sr">3 days, 2 nights</h3><ol class="days">' + days(K.days_3d) + '</ol>' + pk(K.price_3d) + '</div>' +
      '<div class="plan p4"><h3 class="sr">4 days, 3 nights</h3><ol class="days">' + days(K.days_4d) + '</ol>' + pk(K.price_4d) + '</div></div>' + tbc +
      (PO.show === true && (PO.steps || []).filter(has).length ? '<details><summary>' + esc(T('bangkok.poipet.title', 'How the Poipet border crossing works')) + '</summary><ol>' + PO.steps.filter(has).map(function (s) { return '<li>' + rich(s) + '</li>'; }).join('') + '</ol>' + tbc + '</details>' : '') +
      '<div class="foot"><p class="foot-note">Please check the border status with me before you book.</p>' +
      waBtn('btn btn-wa btn-sm', 'Hi Mr Night, I\'m coming from Bangkok. Can you help me arrange the Travel Mart bus (3-day or 4-day trip), or a pick-up if I fly? Dates: ___ People: ___', 'Ask ' + esc(name)) + '</div></div></div></div></section>\n';
  }

  /* ---------- destinations (Places I can take you) ---------- */
  var D = C.destinations || {};
  var dItems = (D.items || []).filter(function (x) { return has(x.name); });
  if (D.show !== false && dItems.length) out += '<section class="sec" id="places" aria-labelledby="places-h"><div class="wrap"><div class="sec-head"><p class="eyebrow">' + esc(T('destinations.eyebrow', 'Where we can go')) + '</p><h2 id="places-h">' + esc(T('destinations.heading', 'Places I can take you')) + '</h2></div><div class="dgrid">' +
    dItems.map(function (x) {
      var img = safeImg(x.image), nm = str(x.name);
      var msg = (str(D.message) || 'Hi Mr Night, I would like to visit {place}. Can you help me plan it?').replace(/\{place\}/g, nm);
      return '<article class="dcard">' + (img ? '<div class="ph has-img">' + pic(img, nm, '(max-width: 600px) 92vw, (max-width: 960px) 46vw, 380px') + '</div>' : '') +
        '<div class="body"><h3>' + esc(nm) + '</h3>' + (has(x.text) ? '<p>' + rich(x.text) + '</p>' : '') +
        waBtn('btn btn-wa btn-sm dask', msg, 'Ask<span class="sr"> about ' + esc(nm) + '</span>') + '</div></article>';
    }).join('') + '</div><p class="dnote"><a href="/credits.html">Photo credits</a></p></div></section>\n';

  /* ---------- places (photo gallery) ---------- */
  var places = (C.places || []).filter(function (p) { return has(p.name); });
  places = places.filter(function (p) { return safeImg(p.image); });
  if (places.length) out += '<section class="sec sec-alt" id="photos" aria-labelledby="photos-h"><div class="wrap"><div class="sec-head"><p class="eyebrow">' + esc(T('places_eyebrow', 'Photos from my trips')) + '</p><h2 id="photos-h">' + esc(T('places_heading', 'Out and about with my guests')) + '</h2></div><div class="gal2">' +
    places.map(function (p) { return '<figure class="pf pf-land"><div class="pf-img">' + pic(safeImg(p.image), p.name, '(max-width: 600px) 46vw, (max-width: 960px) 30vw, 280px') + '</div><figcaption>' + esc(p.name) + '</figcaption></figure>'; }).join('') + '</div></div></section>\n';

  /* ---------- FAQ ---------- */
  var faq = (C.faq || []).filter(function (f) { return has(f.q) && has(f.a); });
  out += '<section class="sec faqsec" id="faq" aria-labelledby="faq-h"><div class="wrap faq"><div class="sec-head"><p class="eyebrow">Questions</p><h2 id="faq-h">Good to know</h2><p>Can\'t find your answer? Ask me on WhatsApp.' +
    (has(C.reply_time) ? ' I usually reply within ' + esc(C.reply_time) + '.' : '') + '</p>' + waBtn('btn btn-wa faq-btn', 'Hi Mr Night, I have a question: ', 'Ask a question') + '</div><div>' +
    faq.map(function (f, i) { return '<details class="qa"' + (i < 2 ? ' open' : '') + '><summary>' + esc(f.q) + '</summary><p>' + rich(f.a) + '</p></details>'; }).join('') + '</div></div></section>\n';

  /* ---------- contact ---------- */
  var maps = safeUrl(C.google_maps_url);
  out += '<section class="sec" id="contact" aria-labelledby="contact-h"><div class="wrap"><div class="contact"><div class="bg" aria-hidden="true"></div><div class="in"><div>' +
    '<p class="eyebrow">Book your trip</p><h2 id="contact-h">' + esc(T('contact.heading', 'Message ' + name)) + '</h2>' + (has(C.contact && C.contact.text) ? '<p>' + rich(C.contact.text) + '</p>' : '') +
    waBtn('btn btn-wa', T('contact.message'), 'Message ' + esc(name) + ' on WhatsApp') + '<a class="num notranslate" translate="no" href="tel:+' + num + '">' + esc(phone) + '</a>' +
    (email ? '<a class="mail notranslate" translate="no" href="mailto:' + esc(email) + '">' + esc(email) + '</a>' : '') + '</div>' +
    '<div class="mapcard"><div class="map">' + opts.map + '</div><div class="body"><b>Siem Reap town &amp; SAI airport</b><small>Pick-up from any hotel in Siem Reap.</small>' +
    (maps ? '<a class="btn btn-line btn-sm" href="' + esc(maps) + '" target="_blank" rel="noopener noreferrer"><svg class="wa-ico" aria-hidden="true"><use href="#pin"/></svg>Open in Google Maps</a>' : '') + '</div></div></div></div></div></section>\n</main>\n';

  /* ---------- footer ---------- */
  var links = [];
  if (maps) links.push('<li><a href="' + esc(maps) + '" target="_blank" rel="noopener noreferrer">Google Maps</a></li>');
  if (safeUrl(C.facebook_url)) links.push('<li><a href="' + esc(safeUrl(C.facebook_url)) + '" target="_blank" rel="noopener noreferrer">Facebook</a></li>');
  out += '<footer><div class="wrap"><div class="cols"><div>' + brand('color:#fff') + '<p class="foot-about">Private luxury van with driver and licensed guide in Siem Reap, Cambodia. Airport pick-ups, temple days and city transfers.</p></div>' +
    '<div><h2 class="fh">Contact</h2><ul class="flinks"><li><a href="' + esc(wa('')) + '" target="_blank" rel="noopener noreferrer">WhatsApp ' + esc(phone) + '</a></li>' +
    (email ? '<li><a href="mailto:' + esc(email) + '">' + esc(email) + '</a></li>' : '') + links.join('') + '</ul></div>' +
    '<div><h2 class="fh">Trips</h2><ul class="flinks"><li><a href="#trips">Featured trips</a></li><li><a href="#transfers">All trips</a></li><li><a href="#van">The van</a></li><li><a href="#faq">FAQ</a></li></ul></div></div>' +
    '<div class="disc"><p>' + esc(name) + ' is a private driver and licensed guide in Siem Reap, Cambodia.' + (has(C.last_updated) ? ' Last updated ' + esc(C.last_updated) + '.' : '') + '</p>' +
    '<p class="credit">Temple and place photos: Wikimedia Commons contributors, under Creative Commons licences. <a href="credits.html">Photo credits</a></p></div></div></footer>\n';

  /* ---------- floating WhatsApp widget (needs JS; hidden without it) ---------- */
  var WG = C.widget || {};

  out += '<div class="jc" id="jc"><div class="jc-box" role="dialog" aria-label="Chat with ' + esc(name) + ' on WhatsApp" aria-hidden="true">' +
    '<div class="jc-head"><span class="jc-av" aria-hidden="true">' + (headshot ? pic(headshot, '', '48px', 'avimg') : esc(name.replace(/^Mr\.?\s*/i, '').charAt(0).toUpperCase() || 'N')) + '</span>' +
    '<span><b class="notranslate" translate="no">' + brandHtml(brandName) + '</b><small>Luxury van \u00b7 ' + (has(C.reply_time) ? 'usually replies in ' + esc(C.reply_time) : 'Siem Reap') + '</small></span>' +
    '<button class="jc-close" type="button" aria-label="Close chat">\u00d7</button></div>' +
    '<div class="jc-body"><div class="jc-msg">' + esc(T('widget.greeting', 'Hello! I\'m ' + name + '. Message me on WhatsApp.')) + '</div></div></div>' +
    '<a class="jc-btn" id="jcbtn" href="' + esc(wa(WG.message)) + '" aria-label="Chat with ' + esc(name) + ' on WhatsApp">' +
    '<span class="jc-ico" aria-hidden="true"><svg><use href="#wa"/></svg></span><span class="jc-send" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" d="M3 3l18 9-18 9 3-9zM6 12h7"/></svg></span>' +
    '<span class="jc-text">' + esc(T('widget.button_text', 'Open chat')) + '</span><span class="jc-badge" aria-hidden="true">1</span></a></div>\n' +
    '<script src="js/site.js" defer></script>\n</body>\n</html>\n';
  return out;
}

function render404(raw) {
  var C = cleanAll(raw), name = str(C.brand) || str(C.name) || 'Mr Night', num = str(C.whatsapp).replace(/[^0-9]/g, '') || '85517843878';
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>Page not found \u00b7 ' + esc(name) + '</title>\n<meta name="robots" content="noindex">\n' +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<link rel="stylesheet" href="/css/style.css">\n</head>\n<body class="nf">\n<main class="nf-main"><div class="nf-card">' +
    '<a class="brand" href="/"><span class="moon" aria-hidden="true"></span><span><b>' + brandHtml(name) + '</b></span></a>' +
    '<h1>Sorry, this page is not here.</h1><p>The page you wanted does not exist. Go back to the home page, or message me on WhatsApp.</p>' +
    '<p class="nf-ctas"><a class="btn btn-wa" href="https://wa.me/' + num + '" target="_blank" rel="noopener noreferrer">Message ' + esc(str(C.name) || 'Mr Night') + ' on WhatsApp</a> <a class="btn btn-line" href="/">Home page</a></p></div></main>\n</body>\n</html>\n';
}

module.exports = { rich: rich, render: render, render404: render404, clean: clean, cleanAll: cleanAll, baseUrl: baseUrl };
