# NeuroDapt Wheels

The Wheel of Life, Wheel of Relationships and Wheel of Business as free,
public pages, one per wheel: `/` (Wheel of Life), `/wheel-of-relationships`
and `/wheel-of-business`. A visitor scores each of 8 areas from 0 to 100% by tapping the
wheel (or with the + and − buttons), can read what each area covers, can
share a picture of the result (email, WhatsApp, Messenger…), and on a computer
can download it as an image.

- **No average, on purpose.** The aim is an even wheel, not a full one: the
  page shows how uneven the areas are, never an overall score to push up.
- **Works on every screen.** The header carries the logo, the wheel's name
  (centred on the screen) and the wheel picker. On phones the wheel is sized
  so that it and every area's score fit on the first screen together. The
  wheel and its labels are one scalable drawing, so nothing is positioned per
  device: wide screens show the names around the wheel, phones show icons and
  percentages (or icons alone when the wheel is small), with the names in the
  list underneath. On wide screens the scores are headed "Summary"; phones
  leave the heading off. Buttons are the same size on every device, and their
  words sit in the true middle on every device (`text-box` in `styles.css`;
  without it the font lifts them 2-4px on Apple and Android).
- **Descriptions.** Tapping an area's name (or its icon on the wheel) opens a
  short description under it. With a mouse, pointing at an area's icon, name
  or percentage shows it in a small card instead.
- **No download on phones and tablets.** People take a screenshot or use
  Share results there, so the image name and Download button are left off to
  save room. It is one CSS rule (`@media (pointer: coarse)` under "Save and
  reset" in `src/styles.css`); delete it to offer the download everywhere.
- **Share results.** Sends a picture of the open wheel (the same picture
  Download makes) through the device's own share sheet, so the person picks
  the app (email, WhatsApp, Messenger…) and who it goes to. If other wheels
  have scores too, it first asks "Share your other wheels too?" with each of
  them to tick (none ticked to start with); an empty wheel asks for scores
  first. The pictures are drawn a moment after the scores settle, so the
  share sheet opens within the tap: Safari refuses a share that comes after
  waiting for anything. A browser that cannot share pictures shares the
  scores as words instead; one that cannot share at all says what to do on a
  phone, and on a computer the button is hidden (Download is there).
- **Private.** Scores are kept in the visitor's own browser (so a reload
  doesn't lose them). The page itself sends nothing anywhere: it has no
  server, no analytics, and loads nothing from any other website. Sharing is
  done by the device, only when the person chooses to.
- **Standalone.** A static site with no login and no connection to the
  clinic app.
- **Found by search engines and AI assistants.** Each wheel's page is built
  ahead of time with its whole content in the HTML (most AI crawlers do not
  run JavaScript), its own title, description, canonical address,
  link-preview tags and schema.org data (WebApplication, FAQPage, the
  organisation and its author). Each page also says what the wheel is, how
  to use it, its areas and common questions, but out of the way: a quiet
  row of small icons under the wheel (About, How to use, Areas, FAQ), each
  opening its panel. Closed panels are hidden from view, not left out of the
  page, so search engines and AI assistants still read every word. The site
  also has `sitemap.xml`, `robots.txt` (pointing to it), `llms.txt` (a plain
  summary for AI assistants) and a real 404 page.
- **An app on the phone.** "Get the app" (the last icon in the row, on
  phones and tablets only) adds the site to the home screen: one button on
  Android, the Share → Add to Home Screen steps on iPhone and iPad. It then
  opens full screen like any app, works without the internet (`sw.js`
  keeps the site's own files on the device), and offers each wheel from a
  long press on its icon. Android's install sheet shows a picture of each
  wheel (`public/screenshots/`). Nothing is sent anywhere, and the scores
  stay on the phone as before. There is no app-store version.

## Working on it

Needs Node 22.12 or newer (`.nvmrc` says 24).

```sh
npm install
npm run dev       # http://localhost:5173, reloads as you edit
npm test          # the tests
npm run build     # the site, ready to publish, in dist/ (builds the app, then
                  # each wheel's page with scripts/prerender.mjs, then the
                  # offline helper sw.js with scripts/build-sw.mjs)
npm run preview   # serve dist/ locally to check the build
```

## Changing the wheels

Everything about the wheels lives in `src/wheels/config.js`:

- **Rename an area:** edit its `name`. Long names wrap onto two lines
  automatically.
- **Change what an area's description says:** edit its `about` (a sentence
  or two; a test keeps it under 140 characters so it fits the card).
- **Change an icon:** set `icon` to any name from
  [phosphoricons.com](https://phosphoricons.com), then run `npm run icons`.
  That copies the icon's drawing into `src/wheels/icons.generated.js`. A test
  fails if you forget.
- **Add a wheel:** add an entry to `WHEELS` with an `id`, a `title`, a short
  `tab` label, colours and 8 slices, and its page to `PAGES` in
  `src/wheels/pages.js`. It appears in the picker and gets its own page.
  `ink` is the text colour; a test checks it is readable on white.
- **Colours:** `fill` paints scored rings, `stroke` draws the outer rim (the
  lines inside it are a much lighter version of it, set by
  `INNER_LINE_FADE` in `src/wheels/colour.js`), `ink` is used for text,
  buttons and the score outlines.

**Change a page's search title, description or "about" text:** edit
`src/wheels/pages.js` (keep descriptions to about 150 characters; a test
checks). The same text feeds the page, its schema.org data and `llms.txt`.

Each wheel has its own address: `/`, `/wheel-of-relationships`,
`/wheel-of-business`. Short ones redirect there (`/life`, `/relationships`,
`/business`, `/wheel-of-life`; see `public/_redirects`), and older links
such as `/#business` still work. The home page opens the wheel last used on
that device.

## Where things are

| Path | What it does |
| --- | --- |
| `src/App.jsx` | Page layout, scores, remembering them, the wheel's address |
| `src/wheels/pages.js` | Each wheel's page: address, search title and description, "about" text and questions |
| `src/wheels/seo.js` | Builds each page's head tags, schema.org data, `sitemap.xml` and `llms.txt` (build time only) |
| `src/entry-server.jsx`, `scripts/prerender.mjs` | Build each wheel's page ahead of time, plus `404.html` |
| `src/components/AboutWheel.jsx` | Under the wheel: the row of small icons and their panels (what it is and the other wheels, how to use it, its areas, questions, the app) |
| `src/components/GetApp.jsx` | The "Get the app" panel: the install button, or the iPhone or browser-menu steps |
| `src/pwa.js` | The app side: starts the offline helper, catches the browser's install offer, knows an iPhone and an installed app |
| `src/sw/worker.js`, `scripts/build-sw.mjs` | The offline helper; the build writes it to `dist/sw.js` with the list of files it keeps |
| `src/components/SiteFooter.jsx` | The footer, with the large logo linking to neurodapt.au |
| `src/components/WheelChart.jsx` | The interactive wheel (SVG) |
| `src/components/ScoreList.jsx` | The list of areas with + and − buttons; tapping a name opens its description |
| `src/components/AreaCard.jsx` | The description card shown while a mouse points at an area |
| `src/components/Actions.jsx` | Image name and Download (computers only), Share results, Reset this wheel / Reset all wheels |
| `src/components/ShareResults.jsx` | The Share results button and its "Share your other wheels too?" question; draws the pictures ahead of time |
| `src/wheels/share.js` | What this browser can share, which other wheels have scores, and the words sent with the pictures |
| `src/wheels/geometry.js` | Wheel shapes, label positions, and which label style fits (shared by the page and the image) |
| `src/wheels/colour.js` | The light inner lines and dark rim; each wheel's colours as CSS (`vite.config.js` serves it) |
| `src/wheels/exportImage.js` | Draws the PNG (for Download and Share results) and downloads it |
| `src/wheels/storage.js` | Saving and safely re-reading scores |
| `src/styles.css` | All styling; one-column on phones, two columns on wide screens and sideways phones. `--header-total` must match the header's real height (the phone wheel is sized from it) |
| `public/_headers` | Security headers (Cloudflare Pages) |
| `public/_redirects` | Short and older addresses for the wheels' pages |
| `public/robots.txt` | Lets every crawler in and points to the sitemap |
| `src/assets/logo.svg` | The NeuroDapt logo: the page header, the downloaded image, and the source of every picture below |
| `public/og-image.png` | The picture shown when the link is shared (WhatsApp, Messages, Facebook…), set for every page in `src/wheels/seo.js` |
| `public/favicon.svg`, `favicon.ico` | Browser-tab icon: the logo's mountain, with heavier lines so it shows at 16px |
| `public/apple-touch-icon.png`, `icon-*.png` | Home-screen and install icons: the full logo |
| `public/manifest.webmanifest` | The app's name ("Wheels" under the icon), colours, icons, a shortcut to each wheel, and the install-sheet pictures |
| `public/screenshots/*.png` | The install-sheet pictures: each wheel on a phone with sample scores, 780×1688 (a 390×844 screen at 2×). Take them again after a big change to the look; the manifest states their size, and a test checks it |

## Publishing (Cloudflare Pages)

The site is static, so Cloudflare Pages hosts it for free on its own
address, separate from the clinic app.

1. Cloudflare dashboard → **Workers & Pages** → **Create application**. That
   screen opens on the *Workers* flow: switch to **Pages** (the "Pages" tab, or
   "Looking to deploy Pages? Get started"), then **Import an existing Git
   repository** → choose `gin-neurodapt/neuro-wheels`.
2. Settings:
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `24`
3. Save and deploy. Check the `*.pages.dev` address it gives you.
4. **Custom domains** → add the subdomain you want (for example
   `wheels.neurodapt.au`). The `neurodapt.au` zone is already on Cloudflare,
   so the DNS record is created for you.
5. After it is live, retire the old Firebase site (`neurodapt-wheels.web.app`)
   so there is only one copy.

`public/_headers` is copied into the build and sets a strict
Content-Security-Policy (this site only; no inline code; no outside
requests), `nosniff`, a referrer policy, a permissions policy that turns off
camera/microphone/location, and long-term caching for the hashed files in
`/assets/`. Embedding in a frame is allowed only from `neurodapt.au` and its
subdomains. Change `frame-ancestors` to `'none'` to forbid embedding.
The offline helper, `sw.js`, gets a policy of its own (a helper obeys the
policy sent with its own file): it may fetch this site's files and nothing
else. Without that rule the page's `connect-src 'none'` would stop it
keeping anything, and the app would not open offline.
Each page's schema.org data is an inline JSON block: browsers never run it,
so the policy does not block it. The built pages carry no inline `style=""`
(`seo.js` strips the few the app sets; the browser sets them again).

**Search engines.** The sitemap is `https://wheels.neurodapt.au/sitemap.xml`.
Submit it in Google Search Console and in Bing Webmaster Tools (Bing's index
also feeds ChatGPT search and Copilot). Cloudflare's AI crawler settings for
the `neurodapt.au` zone decide which AI crawlers may read the site.

**Cloudflare features that inject scripts conflict with this policy.** The
policy blocks any script it did not ship with, so for this subdomain keep
**Rocket Loader** off (it would leave the page blank), and don't turn on
automatic **Web Analytics** injection or **Zaraz**. Bot Fight Mode's
JavaScript check is blocked too; that only shows as a console message, and
the page works.

Scripts are allowed only from the `/assets/` folder (every script the app
ships is there), not from anywhere on the site. Cloudflare's **Google tag
gateway** for the `neurodapt.au` zone adds Google's tag to every page as a
script served from this site's own address (`/metrics/`), which a plain
`'self'` would let run; it is set for the whole zone and cannot be turned off
for one subdomain. The folder rule blocks it, along with the two small inline
scripts it adds. **If the site moves to a new address, add that address to
`script-src` in `public/_headers`**, or the page stays blank there (a test
checks the current address is listed).
