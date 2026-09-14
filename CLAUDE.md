# Recipe Cards

Single-file PWA (`index.html`) of flippable recipe cards. Deployed by Vercel on push to `main`
at https://recipe-cards-xi.vercel.app/. No build step. `sw.js` handles offline caching.

## Adding a recipe

The user pastes a recipe (often from ChatGPT, NYT Cooking, or a recipe site, with their own
tweaks). Turn it into a card, commit, push. Vercel deploys in about a minute.

1. **Normalise to 4 servings.** All quantities are stored for 4 servings (`BASE = 4` in the
   script); the Servings control scales from there.
2. **Pick a category** from: `seafood`, `poultry`, `beef`, `pasta`, `soup`, `breakfast`,
   `dessert`, `vegetarian`. Each has a stock colour and an icon in the sprite at the top of
   `<body>`. To add a category, add a `--stock` rule in the front CSS and a `<symbol>` to the
   sprite.
3. **Copy an existing card block** (they start with `<!-- CARD: name -->` inside
   `.cards-grid`) and paste it before `<div class="no-results" id="no-results">`.
4. **Fill in the front:** `data-category`, the category label, the icon `href`, and the
   title in `.ft-script`. Leave `.front-ing` and `.front-steps` empty; JS fills them.
5. **Fill in the back:**
   - `.back-title` matches the front title exactly. `.serves` stays `Serves 4`.
   - Ingredients go in two `<ul>`s, roughly balanced. Each `<li>` needs
     `data-qty` (number, for 4 servings) and `data-name` (everything after the number).
     Units the converter understands, when they lead `data-name`: `tbsp`, `tsp`, `oz`,
     `fl oz`, `lb`/`lbs`, `cup`/`cups`, `g`, `kg`, `ml`. Countable items (eggs, cloves)
     have no unit and get singularised automatically at quantity 1.
     Example: `<li data-qty="0.5" data-name="cup all-purpose flour">½ cup all-purpose flour</li>`
   - 5–7 instruction steps, one sentence or two each. Guided Mode reads times like
     "3 min", "1–2 min", "30 seconds", "1 hour" out of step text to offer a timer, so keep
     times in that form.
   - Exactly two tips.
6. **Search** indexes title, `data-name`, and category. Nothing else to update.
7. `sw.js` does not need a version bump for new cards. Bump `CACHE_VERSION` only when a
   file that is already cached under the same name changes (fonts, vendor JS, icons, sw.js).

## Verifying visually

Headless Chrome is at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
Its window clamps to ~485px wide, so for phone-width shots load the page in a 390px iframe
rather than passing `--window-size=390`. `requestAnimationFrame` does not tick in headless,
so stub it before exercising html2canvas (the share export).
