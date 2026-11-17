#!/usr/bin/env node
/* Link and escaping tests for the renderer. Run: node tests/links.test.js (no dependencies). */
'use strict';
var assert = require('assert');
var R = require('../src/render.js');
var fs = require('fs'), path = require('path');
var n = 0;
function t(name, fn) { fn(); n++; console.log('ok - ' + name); }

t('injected <script> stays plain text', function () {
  var h = R.rich('Hello <script>alert(1)</script> "x" & \'y\'');
  assert.ok(h.indexOf('<script') === -1);
  assert.ok(h.indexOf('&lt;script&gt;alert(1)&lt;/script&gt;') !== -1);
  assert.ok(h.indexOf('&quot;x&quot; &amp; &#39;y&#39;') !== -1);
});
t('[x](javascript:alert(1)) is not linked', function () {
  var h = R.rich('[x](javascript:alert(1))');
  assert.ok(!/<a\b/i.test(h), h);
  var h2 = R.rich('[x](javascript:alert)');
  assert.ok(!/<a\b/i.test(h2) && h2 === 'x', h2);
  ['[x](data:text/html,hi)', '[x](vbscript:msgbox)', '[x](//evil.com)', '[x](JaVaScRiPt:alert)'].forEach(function (s) { assert.ok(!/<a\b/i.test(R.rich(s)), s); });
});
t('valid markdown link renders as <a> with new tab', function () {
  var h = R.rich('Buy at [angkorenterprise.gov.kh](https://www.angkorenterprise.gov.kh/), or later.');
  assert.strictEqual(h, 'Buy at <a href="https://www.angkorenterprise.gov.kh/" target="_blank" rel="noopener noreferrer">angkorenterprise.gov.kh</a>, or later.');
});
t('bare https URL and bare domain are linked, trailing dot kept outside', function () {
  assert.ok(R.rich('See https://example.com/a?b=1&c=2.').indexOf('<a href="https://example.com/a?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">https://example.com/a?b=1&amp;c=2</a>.') !== -1);
  assert.ok(R.rich('go to example.org.').indexOf('<a href="https://example.org/"') !== -1);
});
t('mailto, tel and wa.me open normally (no target)', function () {
  assert.strictEqual(R.rich('[mail](mailto:a@b.com)'), '<a href="mailto:a@b.com">mail</a>');
  assert.strictEqual(R.rich('[call](tel:+85517843878)'), '<a href="tel:+85517843878">call</a>');
  assert.strictEqual(R.rich('[chat](https://wa.me/85517843878)'), '<a href="https://wa.me/85517843878">chat</a>');
  assert.strictEqual(R.rich('me@example.com'), '<a href="mailto:me@example.com">me@example.com</a>');
});
t('quotes in a link URL cannot break out of href', function () {
  var h = R.rich('[x](https://a.com/"onmouseover="alert(1))');
  assert.ok(h.indexOf('onmouseover="') === -1, h);
});
t('square-bracket notes are still removed, links are kept', function () {
  assert.strictEqual(R.clean('Mr Night [full name]'), 'Mr Night');
  assert.strictEqual(R.clean('at [site](https://a.com/) now'), 'at [site](https://a.com/) now');
});
t('built page: no plain-text URL or domain outside links, no <script> from content', function () {
  var site = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/site.json'), 'utf8'));
  site.faq = site.faq.concat([{ q: 'Test <script>alert(1)</script>', a: 'Bad [x](javascript:alert(1)) good [y](https://example.com/)' }]);
  var html = R.render(site, { icons: '', map: '' });
  assert.ok(html.indexOf('<script>alert(1)</script>') === -1);
  assert.ok(html.indexOf('href="javascript:') === -1);
  assert.ok(html.indexOf('<a href="https://example.com/" target="_blank" rel="noopener noreferrer">y</a>') !== -1);
  var text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<a\b[\s\S]*?<\/a>/g, '').replace(/<[^>]+>/g, ' ');
  var bare = text.match(/\bhttps?:\/\/\S+|\b(?:www\.)?(?:[a-z0-9-]+\.)+(?:com|org|net|info|io|co|uk|kh|th|gov|edu|travel|asia)\b/gi) || [];
  assert.deepStrictEqual(bare, [], 'plain-text addresses: ' + bare.join(', '));
});
console.log(n + ' tests passed');
