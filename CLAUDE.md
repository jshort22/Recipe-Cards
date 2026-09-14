# Recipes

Single-file PWA (`index.html`) of recipe cards. Deployed by Vercel on push to `main`
at https://recipe-cards-xi.vercel.app/. No build step. `sw.js` handles offline caching.

Interaction: the grid shows card fronts. Tapping a card opens a full-screen recipe view
(`#recipe-overlay`) that clones the card's hidden `.back` into a scrollable sheet, with Share
and "Start Cooking" buttons. In that view "Serves N" is a button opening a servings picker
(1–10 plus a custom number, capped at `MAX_SERVINGS` = 50). Each recipe opens at its
`data-default-serves`; a chosen count is remembered per recipe for the session. Units and Font live in the header as settings; search has its own box. Start Cooking launches the step-by-step cook overlay
(`#cook-overlay`: ingredient checklist, then one step at a time with timers). Cards do not
flip; the `.card-back` face exists only as the data source for the view, share export, and
cook overlay.

## Adding a recipe

The user pastes a recipe (often from ChatGPT, NYT Cooking, or a recipe site, with their own
tweaks). Turn it into a card, commit, push. Vercel deploys in about a minute.

1. **Normalise to 4 servings.** All quantities are stored for 4 servings (`BASE = 4` in the
   script); the Servings control scales from there. For baked goods that means dividing a
   full-pan recipe down (e.g. a 12-serving 9×14 pan ÷ 3) and noting the pan size for the
   original yield in the first step. Prefer units that stay readable at 1 serving: tbsp
   rather than cup for anything under ½ cup at 4 servings, since fmtQty shows `0` below ⅛.
2. **Pick a category** from: `seafood`, `chicken`, `beef`, `pasta`, `soup`, `breakfast`,
   `dessert`, `vegetarian`, `baking` (breads, cornbread, and other baked sides). Chicken
   dishes are `chicken`; if turkey or duck ever appear, add a specific category rather
   than a generic poultry one. Each has a stock colour and an icon in the sprite at the top of
   `<body>`. To add a category, add a `--stock` rule in the front CSS and a `<symbol>` to the
   sprite.
3. **Set the default servings** on the scene: `<div class="card-scene" data-default-serves="N">`.
   The recipe view opens at N. Use 2 for a weeknight dinner for the user's household,
   4 for batch dishes (soups, stews, sauces, curries, meatballs, a whole Wellington), and the
   full original yield for baking and desserts (e.g. cornbread 12).
4. **Copy an existing card block** (they start with `<!-- CARD: name -->` inside
   `.cards-grid`) and paste it before `<div class="no-results" id="no-results">`.
5. **Fill in the front:** `data-category`, the category label, the icon `href`, and the
   title in `.ft-script`. Leave `.front-ing` and `.front-steps` empty; JS fills them.
   The front carries no serves text.
   **Cite the source.** If the recipe came from somewhere (NYT Cooking, Allrecipes, Serious
   Eats, a cookbook), add a source tag as the first child of `.front` so it can be tracked
   down later. Use a link when there is a URL; plain text otherwise. Ask for the source if
   the user doesn't give one. Recipes the user wrote or built with ChatGPT get no tag.
   ```html
   <a class="front-source" href="https://cooking.nytimes.com/..." target="_blank" rel="noopener">NYT Cooking</a>
   <div class="front-source">Salt Fat Acid Heat</div>
   ```
   Tapping a source link opens it instead of flipping the card.
6. **Fill in the back:**
   - `.back-title` matches the front title exactly. `.serves` stays `Serves 4`.
   - **Leave out pantry staples that aren't measured into the dish.** Oil that only greases
     the pan for searing or sautéing is not an ingredient; oil mixed into a batter or a sauce
     (scampi, cornbread) is. "Salt, to taste" is not an ingredient; a measured salt
     (`¼ tsp salt`) or a specialty salt (`½ tsp kosher salt`) is. The steps still say
     "heat the oil" and "season to taste" as normal.
   - Ingredients go in two `<ul>`s, roughly balanced. Each `<li>` needs
     `data-qty` (number, for 4 servings) and `data-name` (everything after the number).
     Units the converter understands, when they lead `data-name`: `tbsp`, `tsp`, `oz`,
     `fl oz`, `lb`/`lbs`, `cup`/`cups`, `g`, `kg`, `ml`. Countable items (eggs, cloves)
     have no unit and get singularised automatically at quantity 1.
     Example: `<li data-qty="0.5" data-name="cup all-purpose flour">½ cup all-purpose flour</li>`
     Countable names are written **plural** (`eggs, beaten`, `onions, diced`, `jalapeños`); the
     app singularises at 1 or below. Canned goods are given in `oz` with the word `canned` in
     the name so they never flip to pounds: `data-name="oz canned diced tomatoes"`.
   - **Scaling rule** (`data-scale`, default linear). Tag anything that shouldn't simply multiply:
     - `season` — salt, pepper, dried spices, flakes, Worcestershire, Dijon, sauté oil. Scales by ratio^0.7.
     - `fixed` — pan-dependent: poaching vinegar, reserved pasta water, "a pinch of".
     - `whole` — countables that can't be split (eggs). Default for integer countables anyway.
     - `half` — countables that halve sensibly: chicken breasts, onions, shallots, lemons, limes, peppers.
     Customary amounts are then snapped to kitchen measures (tsp → tbsp at 3 tsp, tbsp → cup at
     ¼ cup, oz → lb at 32 oz, under ⅛ tsp becomes "Pinch of"), so pick units freely.
   - 5–7 instruction steps, one sentence or two each. The cook overlay reads times like
     "3 min", "1–2 min", "30 seconds", "1 hour" out of step text to offer a timer, so keep
     times in that form.
   - Exactly two tips.
7. **Search** indexes title, `data-name`, and category. Nothing else to update.
7. `sw.js` does not need a version bump for new cards. Bump `CACHE_VERSION` only when a
   file that is already cached under the same name changes (fonts, vendor JS, icons, sw.js).

## "What can I make?"

A button beside the search opens `#pantry-overlay`: a checklist of every distinct ingredient
across the deck, with recipes you can make (all non-optional ingredients ticked) and "Almost
there" (missing 1–2) updating live. Ticked state persists in `localStorage` under
`recipes.pantry.v1`. Pantry staples start ticked.

Ingredient identity comes from `ingredientKey(data-name)` in the script: units and prep words
are stripped, then an `ALIASES` table maps variants to one canonical key (`unsalted butter` →
`butter`, `chicken broth` → `chicken stock`, `egg yolks` → `eggs`). `STAPLES` lists keys assumed
on hand; `GROUPS` sorts the rest into Proteins / Produce / Dairy & cheese, else Other; `LABELS`
fixes capitalisation of proper nouns. Names containing "optional" are ignored for matching.

**When adding a recipe**, check what its ingredients key to. In the browser console:
`[...document.querySelectorAll('.card-scene')].at(-1).querySelectorAll('[data-name]').forEach(l => console.log(l.dataset.name, '→', ingredientKey(l.dataset.name)))`.
A new ingredient that keys to something wrong or too specific needs an `ALIASES` entry; a new
staple goes in `STAPLES`; a protein, produce, or dairy item goes in `GROUPS`.

## Verifying visually

Headless Chrome is at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
Its window clamps to ~485px wide, so for phone-width shots load the page in a 390px iframe
rather than passing `--window-size=390`. `requestAnimationFrame` does not tick in headless,
so stub it before exercising html2canvas (the share export).
