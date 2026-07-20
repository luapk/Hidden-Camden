# Hidden Camden — marketing site

A standalone, self-contained promo site for the Hidden Camden app. No build
step, no framework, no dependencies. Plain HTML, one stylesheet, a little JS.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
cd site
python3 -m http.server 8080   # then open http://localhost:8080
```

## Deploy it

Point any static host at this folder (Vercel, Netlify, Cloudflare Pages,
GitHub Pages, S3). The root is `site/`, the entry is `index.html`. Nothing
to compile.

## Structure

```
site/
  index.html      # the one page
  styles.css      # design system, mirrors the app's tokens
  main.js         # reveal-on-scroll + store-button stubs
  assets/
    logo.png          # the torn-poster wordmark (transparent cutout)
    logo-poster.png   # original artwork with black background
    logos/            # partner logos — drop real files here (see its README)
```

## What still needs real assets

- **Partner logos** — `assets/logos/` has placeholders that swap
  automatically when you add the official files. See its README.
- **Voice portraits** — the guide cards (Yungblud, Carl Barât, Suggs,
  Little Simz, plus The Local and Sammie) currently use monogram plates.
  To use real press shots, add an `<img>` inside each `.voice` card and a
  matching style; ask and this can be wired up.
- **App store links** — the download buttons point at `#` until the iOS
  and Android apps ship. Swap the `href`s for the real store URLs then.
- **Contact addresses** — `partners@hiddencamden.com` and
  `hello@hiddencamden.com` are placeholders; point them at real inboxes.

## Design

Committed dark identity: acid (#CCFF00) on ink/night, paper for warm
contrast blocks. Fonts: Anton (display), Jost (body), Courier Prime (data),
Space Grotesk (labels) — the same stack as the app, loaded from Google
Fonts. Copy follows the app's rules: no em dashes, no exclamation marks,
dry North London voice.

## The listings model, in one line

The tour route is editorial and never for sale. Revenue comes from the
layers around it: What's On gig listings, a free-pin venue directory with a
paid Verified Partner tier, and sponsored rewards billed per redemption.
The "For venues" section on the page pitches all three.
