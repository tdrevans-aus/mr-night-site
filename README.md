# Mr Night · Siem Reap Driver & Guide – website (private luxury van and licensed guide in Siem Reap)

A free, one-page website for Mr Night (Meun Reatrey), a private driver and licensed guide in Siem Reap, Cambodia (Toyota Alphard with reclining massage seats).

- **All words, prices, photos and on/off switches live in one file: `content/site.json`.**
- Mr Night edits that file (and uploads photos to `images/`) from his phone with **Pages CMS** (free).
- A tiny build step with **no dependencies** (`node build.js`) bakes the content into plain HTML in `dist/`. Visitors without JavaScript, search engines and WhatsApp/Facebook link previews all see the full page.
- Hosting: **Cloudflare Pages** free plan. Cost: **US$0**. A domain name is optional (about US$11 a year, which Mr Night must renew himself).

This project is separate from any other project. It must belong to Mr Night's own accounts.

## Cloudflare Pages build settings

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `node build.js` |
| Build output directory | `dist` |
| Root directory | (leave empty) |
| Environment variables | none needed (optional: `NODE_VERSION` = `20`) |

Every commit (including every **Save** in Pages CMS) makes Cloudflare run `node build.js` again, and the new site is live in about a minute.

## Files

```
content/site.json   ALL the content Mr Night edits (single source of truth)
.pages.yml          Pages CMS settings (turns site.json into a phone form)    [not published]
build.js            build script: content/site.json -> dist/                [not published]
src/render.js       turns the content into HTML (used by build.js)            [not published]
src/icons.svg.html, src/map.svg.html   inline SVG pieces used by the build   [not published]
css/style.css       design
js/site.js          small script: WhatsApp chat bubble only (page works without it)
images/             photos (Pages CMS uploads go here); images/stock/ = credited temple/place photos
credits.html        photo credits page (published, linked in the footer)
favicon.svg, favicon.ico, favicon-32.png, apple-touch-icon.png, images/og-image.jpg
README.md, EDIT-GUIDE.md, CREDITS.md   documentation                        [not published]
HANDOVER.md         start here: handover notes for the IT support company      [not published]
NIGHT-SETUP.md      helper scripts: Google profile call, WhatsApp Business texts, review request [not published]
dist/               build output (not committed; Cloudflare builds it)
```

`build.js` publishes **only** `css/`, `js/`, `images/`, `credits.html` and the favicons, plus the generated `index.html`, `404.html`, `robots.txt` and `sitemap.xml`. Documentation, the CMS config, build scripts and any QA files never go online.

## Build and preview on a computer

```
node build.js
python3 -m http.server 8000 --directory dist
```
Then open http://localhost:8000 . Add `?chat=open` to see the WhatsApp chat bubble open.

## Rules built into the build

- **Brand vs name:** `brand` in `site.json` ("Mr Night · Siem Reap Driver & Guide") is the site name: logo text in the header and footer (the part before " · " is the big logo text, the part after it the small line under it; `tagline` is only used if the brand has no " · "), `<title>`, `og:title`, `og:site_name`, `apple-mobile-web-app-title`, the WhatsApp widget name, the 404 page and the JSON-LD business name. `name` ("Mr Night") is his name in running text, buttons ("Message Mr Night on WhatsApp"), quotes and prefilled WhatsApp messages ("Hi Mr Night, ..."). The About heading is its own field ("Mr Night (Meun Reatrey)").

- **Website address:** `base_url` in `site.json` (currently `https://mrnight-tourguide.pages.dev`, which is **provisional** until Night's own Cloudflare Pages project exists – it was unregistered on 17 Nov 2026; if the project ends up with a different address, change `base_url` and rebuild. Note: `mrnight.pages.dev` belongs to someone else, never use it). It is used for the canonical link, `og:url`, the absolute `og:image`, `robots.txt` and `sitemap.xml`.
- **[Brackets] are notes, not content.** Any text in `[square brackets]` is removed when the page is built. If nothing meaningful is left, the field is hidden. Example: `"Mr Night [full name]"` shows as "Mr Night". A featured trip whose title is only a note (e.g. `"[waterfall, confirm: Kulen?]"`) shows its `fallback_title` instead ("Waterfall day").
- **Prices:** an empty price shows "Message me for price". Never invent a price.
- **Photos:** an empty photo field is left out of the page (no grey boxes, no "PHOTO:" labels); the layouts close up. `photos.headshot` is the round face photo (About heading, contact card, WhatsApp widget); `photos.night` is the big About photo. Photos in `images/night/` have resized WebP copies next to them (`name-800w.webp` etc.); `build.js` finds them and writes `<picture>` with a WebP `srcset` and the JPG as fallback. A photo uploaded later through Pages CMS without WebP copies just renders as a plain `<img>`.
- **Links in text:** text fields are escaped first, then `[words](https://...)`, bare `https://` addresses, bare domains (e.g. `angkorenterprise.gov.kh`) and email addresses become links. Only http(s), `mailto:` and `tel:` are allowed; anything else (e.g. `javascript:`) is never linked. External links get `target="_blank" rel="noopener noreferrer"`; wa.me, tel: and mailto: links open normally. Tests: `node tests/links.test.js`.
- **Reviews are OFF by default.** Nothing about reviews shows unless it is switched on **and** has a real `https://` link:
  - `reviews.tripadvisor` – show + link. If `widget_location_id` (numbers only) is filled, TripAdvisor's free live widget is used (rating badge in the bar, latest reviews in the reviews section).
  - `reviews.google` – show + link + a rating and count that Mr Night types himself (for example 4.9 and 12). If either is missing or not a number, nothing shows.
  - `reviews.getyourguide`, `reviews.booking` – show + link.
  - `reviewsWall` – show + at least one real review with a link (or the TripAdvisor live widget).
  - `award` – show + title + link to proof.
  - All typed text is escaped. Links must start with `https://`.
- **Border closed (Nov 2026):** `bangkok.show` is `false`, so the whole Bangkok section, the Poipet steps and the border line render nothing (no nav item, no empty section). The border line only ever renders inside the Bangkok section. All the Bangkok/border content stays in `site.json` and in Pages CMS; switching `bangkok.show` back on (EDIT-GUIDE section 3) restores it. `border.note` is editable.
- **Van capacity and luggage:** `vehicle.seats` (6) and `vehicle.capacity` ("up to 6 guests") feed the trust row ("Price per van, up to 6 guests"), the price-table header, the van section and the About facts band. `vehicle.luggage_note` shows in the van section, on featured cards with `show_luggage: true` (the airport card) and in Flying in (`flying_in.show_luggage`). The FAQ has a matching "How many people and bags fit?" entry.
- **Translate menu:** `translate.show` / `translate.languages` (default `zh-CN,ko,fr,ja`; English is the page language and the first menu item, choosing it restores the original). `js/site.js` loads Google's free Website Translator (`translate.google.com/translate_a/element.js`) only when the menu is on; the globe button stays hidden until the script loads, so no-JS or blocked-script visitors see nothing and get no errors. Google's top bar, tooltips and highlight are hidden by CSS so the layout doesn't move. The brand name, phone number, signature, widget name and the header "WhatsApp" label are `notranslate`; WhatsApp prefills are URLs and are never translated. Note: Google's translation is automatic and can be imperfect, and Google logs a usage ping that sometimes returns 500 in the console (harmless, not from this site).
- **Flying in:** `flying_in` (show, eyebrow, heading, text with a `{flights}` token, flights, button, message, image) is the airport section that replaces Bangkok in the page and nav ("Flying in" → `#flying-in`).
- **Bangkok card:** the bus is Travel Mart's. `bangkok.tbc` shows a small "To be confirmed" note under the day plans and the Poipet steps until the details are checked against the brochure; switch it off when confirmed.
- **Book now, pay later** shows only if both `show` and `confirmed` are on.
- **WhatsApp:** every button opens `https://wa.me/<number>?text=<message>`, using `whatsapp` from `site.json`.
- **Driver and guide:** Mr Night is a private driver **and** a fully qualified, licensed Siem Reap guide. The full sentence "Driver and licensed guide in one. I am a fully qualified Siem Reap guide, so I can drive you and guide you inside the temples." appears once, in the guide box; the FAQ has a short version. Do not repeat it on the trip cards. The trust row and the About facts band show "Licensed Siem Reap guide".

## Handover to Mr Night (do these with him; all free)

Do not create accounts for him without his say. He should own every account, with his own email and password.

1. **Email:** he needs an email address he can open on his phone (a new Gmail is fine).
2. **GitHub account:** on his phone, go to https://github.com/signup and create an account with that email. Turn on two-factor sign-in and keep the recovery codes safe.
3. **Put the code on GitHub:** create a new repository in his account (for example `mr-night-site`), then push this folder:
   ```
   git remote add origin https://github.com/<his-username>/mr-night-site.git
   git push -u origin main
   ```
   (Or upload the files with GitHub's "Add file → Upload files" page.)
4. **Cloudflare Pages (free):** create a Cloudflare account in his name at https://dash.cloudflare.com/sign-up. Go to **Workers & Pages → Create → Pages → Connect to Git**, pick his repository, and set:
   - Framework preset: **None**
   - Build command: **`node build.js`**
   - Build output directory: **`dist`**
   Save and deploy. The site will be at `https://<project-name>.pages.dev`. Every change saved on GitHub goes live in about a minute.
5. **Pages CMS (free):** open https://app.pagescms.org on his phone, sign in with GitHub, and allow Pages CMS to use his `mr-night-site` repository. It reads `.pages.yml` and shows **My website** as a simple form.
6. **Add the home screen shortcut:** in Chrome on his phone, open app.pagescms.org → menu → **Add to Home screen**.
7. Give him `EDIT-GUIDE.md` (print it or send it on WhatsApp).
8. **After the site has its final address:** in Pages CMS, change **Website address** (`base_url`) to the real address (for example `https://mr-night.pages.dev`). The build then uses it for link previews, the canonical link, robots.txt and sitemap.xml.
9. **Optional domain:** buy one in his name (Cloudflare Registrar is at cost, about US$11 a year), then add it in Cloudflare Pages → Custom domains. He must renew it every year.
10. **Get found:** create a free Google Business Profile and a TripAdvisor listing in his name. When he has real reviews, switch the badges on in Pages CMS.

## Things still to get from Mr Night

- Confirm the guests in `guests-angkor-wat.jpg` are happy to be shown. (Photos of the van inside and the massage seats are done: `images/night/van-seats.jpg`.)
- Prices for every trip (per van), and Bangkok trip prices if he sells them.
- Number of guests the van takes, and which seats have massage.
- His link with the Bangkok tour company, and whether he can advertise its trips.
- Reply time, payment methods, whether he offers "book now, pay later", child seats.
- Google Maps / TripAdvisor / Facebook links, if any.

## Places and photo gallery
- **Places I can take you** (`destinations` in `content/site.json`): one card per place with a name, one-line text, photo and an "Ask" WhatsApp button. The button message is `destinations.message`; `{place}` is replaced by the card name. Use Night's own photo where he has one. If a card uses a stock photo, add the credit to `credits.html` and `CREDITS.md` (no label on the page; the credits page is linked in the footer). Never print green fees or ticket prices.
- **Photos from my trips** (`places` in `content/site.json`): the gallery of Night's own photos (files in `images/night/`). Keep each photo on the page no more than twice.
