# Handover: Mr Night's website

For the IT support company that will host the site and help Mr Night with Google, TripAdvisor and so on. Start here; the other documents are listed at the end.

## What it is

A one-page website for **Mr Night** (official name on his guide licence: Moeurn Chanreatrei), a private driver and Ministry-of-Tourism-licensed guide in Siem Reap with a Toyota Alphard van.

- **Contact:** WhatsApp / phone +855 17 843 878 · mrnighttourguide@gmail.com
- **Current preview:** https://mrnight-preview-temp.vercel.app. This is temporary and will be switched off once your hosting is live.
- **Cost to run:** US$0, apart from an optional domain.

## How it works (5 minutes)

- It's a **plain static site**. There's no database, no server code and no npm packages.
- **All the words, photos and on/off switches** are in one file: `content/site.json`.
- `node build.js` (Node 18 or newer) turns that file into a finished site in `dist/`. Upload `dist/` to **any static host**: Cloudflare Pages, Netlify, Vercel, GitHub Pages, or ordinary web hosting over FTP.
- **Cloudflare Pages settings:** build command `node build.js`, output directory `dist`, framework preset None. The README has full steps.
- **Optional phone editing:** `.pages.yml` sets up Pages CMS (https://pagescms.org), which shows `site.json` as a simple form. Use it or ignore it, as suits you.
- Run the tests with `node tests/links.test.js`.

## First jobs for you

1. **Hosting.** Put the site on your hosting, ideally on an account in Mr Night's name (see the README's "Handover to Mr Night").
2. **Set the real address.** Change `base_url` in `content/site.json` to the final address and rebuild. It's currently a placeholder (`https://mrnight-tourguide.pages.dev`). The canonical link, link previews, `robots.txt` and `sitemap.xml` all use it.
3. **Domain (optional).** For example `mrnightsiemreap.com`, registered in Mr Night's name.
4. **Google Business Profile.** Mr Night has step-by-step instructions (from `NIGHT-SETUP.md` section A) and may have started already, so check with him before creating a new profile.
   - The business name must be just **Mr Night**. Google doesn't allow extra words in the name.
   - It's a **service-area business** (Siem Reap), with no address shown.
   - Once it's live: put the Maps link in `google_maps_url` in `site.json`. When he has 3–5 real reviews, switch on `reviews.google` (`show`, link, rating and count).
5. **TripAdvisor and similar listings.** The site has badge slots for TripAdvisor, GetYourGuide and Booking.com in `reviews`. Switch each one on only when the listing has real reviews.
6. **WhatsApp Business.** Ready-made greeting, away and quick-reply texts and catalogue items are in `NIGHT-SETUP.md` section B. The review-request message is in section C.

## Still needed from Mr Night

- **Prices.** Every trip currently says "Message me for price", which costs bookings. Get a "from" price per van for: the airport pick-up, a temple day, Kulen and golf. Put them in the `price` fields. **Never invent prices.**
- **Name spelling in his story.** The site says "Meun Reatrey" but his licence says "Moeurn Chanreatrei". Ask which he prefers. The licence caption already shows the official spelling.
- The other open items are under "Things still to get" in the README.

## Rules to keep

- **Photos.**
  - Use Mr Night's own photos wherever possible.
  - Stock photos (in `images/stock/`) are from Wikimedia Commons and **must stay credited** in `credits.html` and `CREDITS.md`.
  - For faster loading, add WebP copies named `photo-800w.webp` next to `photo.jpg`. The build picks them up automatically.
- **Brand.**
  - Full name: "Mr Night · Siem Reap Driver & Guide". The site shows it as **Mr Night** with the rest underneath.
  - Logo: `favicon.svg` (a gold moon over Angkor towers).
- **Guide licence.** Only the **front** of the card is on the site. The back, with the licence code and QR code, was left off on purpose, so it can't be copied.
- **Contact.** Everything goes to WhatsApp. There's no booking form and no prices on third-party sites unless Mr Night agrees.

## Documents

| File | What it's for |
|---|---|
| `README.md` | Technical details, build settings, file list, setup steps |
| `EDIT-GUIDE.md` | Plain-English editing guide for Mr Night |
| `NIGHT-SETUP.md` | Google profile steps, WhatsApp Business texts, review request |
| `CREDITS.md` / `credits.html` | Stock photo credits (licences require these) |

Questions about how the site was built: ask Mr Night to put you in touch with the volunteer who built it.
