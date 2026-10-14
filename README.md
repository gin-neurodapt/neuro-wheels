# NeuroDapt Wheels

The Wheel of Life, Wheel of Relationships and Wheel of Business as one free,
public page. A visitor scores each of 8 areas from 0 to 100% by tapping the
wheel (or with the + and − buttons), sees their average, and on a computer can
download the result as an image.

- **Works on every screen.** The wheel and its labels are one scalable
  drawing, so nothing is positioned per device. Wide screens show the names
  around the wheel; phones show icons and percentages, with the names in the
  list underneath.
- **No download on phones and tablets.** People take a screenshot there, so
  the image name and Download button are left off to save room. It is one
  CSS rule (`@media (pointer: coarse)` under "Save and reset" in
  `src/styles.css`); delete it to offer the download everywhere.
- **Private.** Scores are kept in the visitor's own browser (so a reload
  doesn't lose them). Nothing is sent anywhere: the page has no server, no
  analytics, and loads nothing from any other website.
- **Standalone.** A static site with no login and no connection to the
  clinic app.

## Working on it

Needs Node 22.12 or newer (`.nvmrc` says 24).

```sh
npm install
npm run dev       # http://localhost:5173, reloads as you edit
npm test          # the tests
npm run build     # the site, ready to publish, in dist/
npm run preview   # serve dist/ locally to check the build
```

## Changing the wheels

Everything about the wheels lives in `src/wheels/config.js`:

- **Rename an area:** edit its `name`. Long names wrap onto two lines
  automatically.
- **Change an icon:** set `icon` to any name from
  [phosphoricons.com](https://phosphoricons.com), then run `npm run icons`.
  That copies the icon's drawing into `src/wheels/icons.generated.js`. A test
  fails if you forget.
- **Add a wheel:** add an entry to `WHEELS` with an `id`, a `title`, a short
  `tab` label, colours and 8 slices. It appears in the picker and gets its
  own link (`/#<id>`). `ink` is the text colour; a test checks it is
  readable on white.
- **Colours:** `fill` paints scored rings, `stroke` draws the lines, `ink`
  is used for text and buttons.

Links can open a particular wheel directly: `/#life`, `/#relationships`,
`/#business`.

## Where things are

| Path | What it does |
| --- | --- |
| `src/App.jsx` | Page layout, scores, remembering them, the `#wheel` link |
| `src/components/WheelChart.jsx` | The interactive wheel (SVG) |
| `src/components/ScoreList.jsx` | The list of areas with + and − buttons |
| `src/components/Actions.jsx` | Image name and Download (computers only), Reset |
| `src/wheels/geometry.js` | Wheel shapes and label positions (shared by the page and the image) |
| `src/wheels/exportImage.js` | Draws the downloadable PNG and downloads it |
| `src/wheels/storage.js` | Saving and safely re-reading scores |
| `src/styles.css` | All styling; one-column on phones, two columns on wide screens and sideways phones |
| `public/_headers` | Security headers (Cloudflare Pages) |
| `src/assets/logo.svg` | The NeuroDapt logo: the page header, the downloaded image, and the source of every picture below |
| `public/og-image.png` | The picture shown when the link is shared (WhatsApp, Messages, Facebook…), set in `index.html` |
| `public/favicon.svg`, `favicon.ico` | Browser-tab icon: the logo's mountain, with heavier lines so it shows at 16px |
| `public/apple-touch-icon.png`, `icon-*.png` | Home-screen and install icons: the full logo |

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

**Cloudflare features that inject scripts conflict with this policy.** The
policy blocks any script it did not ship with, so for this subdomain keep
**Rocket Loader** off (it would leave the page blank), and don't turn on
automatic **Web Analytics** injection or **Zaraz**. Bot Fight Mode's
JavaScript check is blocked too; that only shows as a console message, and
the page works.
