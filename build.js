#!/usr/bin/env node
/* Mr Night website build. No dependencies (Node 18+).
   Reads content/site.json and writes the finished site to dist/.
   Cloudflare Pages: build command "node build.js", output directory "dist". */
'use strict';
var fs = require('fs');
var path = require('path');
var R = require('./src/render.js');

var ROOT = __dirname;
var OUT = path.join(ROOT, 'dist');
var content = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));

/* Only these files and folders are published. Docs, CMS config, build scripts and QA files stay private. */
var PUBLISH = ['css', 'js', 'images', 'fonts', 'credits.html', '.htaccess', '_headers', 'favicon.svg', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png'];

function rm(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function copy(src, dst) {
  var st = fs.statSync(src);
  if (st.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); fs.readdirSync(src).forEach(function (f) { if (f[0] !== '.') copy(path.join(src, f), path.join(dst, f)); }); }
  else fs.copyFileSync(src, dst);
}

rm(OUT);
fs.mkdirSync(OUT, { recursive: true });
PUBLISH.forEach(function (p) { var s = path.join(ROOT, p); if (fs.existsSync(s)) copy(s, path.join(OUT, p)); });

var icons = fs.readFileSync(path.join(ROOT, 'src/icons.svg.html'), 'utf8');
var map = fs.readFileSync(path.join(ROOT, 'src/map.svg.html'), 'utf8');
/* Resized WebP copies sit next to a photo as name-<width>w.webp (made before upload; the build only finds them). */
function variants(src) {
  if (/^https?:/i.test(src)) return [];
  var dir = path.dirname(src), stem = path.basename(src).replace(/\.[a-z]+$/i, ''), abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  var re = new RegExp('^' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-(\\d+)w\\.webp$');
  return fs.readdirSync(abs).map(function (f) { var m = f.match(re); return m ? { u: dir + '/' + f, w: +m[1] } : null; })
    .filter(Boolean).sort(function (a, b) { return a.w - b.w; });
}
fs.writeFileSync(path.join(OUT, 'index.html'), R.render(content, { icons: icons, map: map, variants: variants }));
fs.writeFileSync(path.join(OUT, '404.html'), R.render404(content));
fs.writeFileSync(path.join(OUT, 'privacy.html'), R.renderPrivacy(content));

var base = R.baseUrl(content);
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + base + 'sitemap.xml\n');
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>' + base + '</loc><lastmod>' + new Date().toISOString().slice(0, 10) + '</lastmod></url>\n</urlset>\n');

var n = 0; (function count(d) { fs.readdirSync(d).forEach(function (f) { var p = path.join(d, f); if (fs.statSync(p).isDirectory()) count(p); else n++; }); })(OUT);
console.log('Built dist/ (' + n + ' files) for ' + base);
