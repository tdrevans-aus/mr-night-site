# Mr Night – private luxury van in Siem Reap

A free, one-page website for Mr Night, a private driver in Siem Reap, Cambodia (Toyota Alphard with reclining massage seats).

- Plain HTML, CSS and a small JavaScript file. **No build step.**
- **All words, prices, photos and on/off switches live in one file: `content/site.json`.**
- Mr Night edits that file from his phone with **Pages CMS** (free).
- Hosting: **Cloudflare Pages** free plan. Cost: **US$0**. A domain name is optional (about US$11 a year, which Mr Night must renew himself).

This project is separate from any other project. It must belong to Mr Night's own accounts.

## Files

```
index.html          the page (layout only; the words come from content/site.json)
content/site.json   ALL the content Mr Night edits
.pages.yml          Pages CMS settings (turns site.json into a phone form)
css/style.css       design
js/site.js          reads site.json and fills the page; WhatsApp chat bubble; review switches
images/             photos (uploads from Pages CMS go here)
images/stock/       free-licence temple and place photos (see CREDITS.md)
credits.html        photo credits page (linked in the footer)
CREDITS.md          photo credits and licences
EDIT-GUIDE.md       simple guide for Mr Night
favicon.svg, favicon.ico, favicon-32.png, apple-touch-icon.png, images/og-image.jpg
```

## Look at it on a computer

```
python3 -m http.server 8000
```
Then open http://localhost:8000 . (Opening `index.html` straight from the disk does not work, because the page loads `content/site.json`.)
Add `?chat=open` to the address to see the WhatsApp chat bubble open.

## Rules built into the page

- **Prices:** an empty price shows "Message me for price". Never invent a price.
- **Photos:** an empty photo field shows a grey box with a label (for example "PHOTO: Alphard interior – massage seats"). Only Mr Night's own photos go there.
- **Reviews are OFF by default.** Nothing about reviews shows unless it is switched on **and** has a real `https://` link:
  - `reviews.tripadvisor` – show + link. If `widget_location_id` (numbers only) is filled, TripAdvisor's free live widget is used (rating badge in the bar, latest reviews in the reviews section).
  - `reviews.google` – show + link + a rating and count that Mr Night types himself (for example 4.9 and 12). If the rating or count is empty, nothing shows.
  - `reviews.getyourguide`, `reviews.booking` – show + link.
  - `reviewsWall` – show + at least one real review with a link (or the TripAdvisor live widget).
  - `award` – show + title + link to proof.
  - All typed text is shown as plain text (HTML is escaped). Links must start with `https://`.
- **Border line:** `border.note` is editable. The default does not say the border is open or closed: "Please message me to check the current border status before you travel."
- **Book now, pay later** shows only if both `show` and `confirmed` are on.
- **WhatsApp:** every button opens `https://wa.me/<number>?text=<message>`, using `whatsapp` from `site.json`.
- He is presented as a **driver, not a licensed temple guide**.

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
   - Build command: **(leave empty)**
   - Build output directory: **/**
   Save and deploy. The site will be at `https://<project-name>.pages.dev`. Every change saved on GitHub goes live in about a minute.
5. **Pages CMS (free):** open https://app.pagescms.org on his phone, sign in with GitHub, and allow Pages CMS to use his `mr-night-site` repository. It reads `.pages.yml` and shows **My website** as a simple form.
6. **Add the home screen shortcut:** in Chrome on his phone, open app.pagescms.org → menu → **Add to Home screen**.
7. Give him `EDIT-GUIDE.md` (print it or send it on WhatsApp).
8. **After the site has its final address:** change `og:image` in `index.html` to the full address (for example `https://mr-night.pages.dev/images/og-image.jpg`) so WhatsApp and Facebook link previews show the picture.
9. **Optional domain:** buy one in his name (Cloudflare Registrar is at cost, about US$11 a year), then add it in Cloudflare Pages → Custom domains. He must renew it every year.
10. **Get found:** create a free Google Business Profile and a TripAdvisor listing in his name. When he has real reviews, switch the badges on in Pages CMS.

## Things still to get from Mr Night

- Photos: him, the Alphard outside, inside, the massage seats, him with guests (with their permission).
- Prices for every trip (per van), the guide price, and Bangkok trip prices if he sells them.
- Number of guests the van takes, and which seats have massage.
- The waterfall trip name (Phnom Kulen?).
- His story in his own words, languages, the year he started driving, licence.
- His link with the Bangkok tour company, and whether he can advertise its trips.
- Reply time, payment methods, whether he offers "book now, pay later", child seats.
- Google Maps / TripAdvisor / Facebook links, if any.
