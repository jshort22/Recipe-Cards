# Recipes

PWA of recipe cards: `index.html` (app and styles) plus `recipes.json` (the recipes). Deployed by Vercel on push to `main`
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

Recipes live in `recipes.json`; `index.html` fetches it on load and builds the card DOM from
it (`renderCards`), so the HTML never needs editing for a new recipe. The user pastes a
recipe (often from ChatGPT, NYT Cooking, or a recipe site, with their own tweaks), or names a
dish and asks for one written from general knowledge. Show the recipe in chat (ingredients,
steps, two tips) for approval first, then append an object to `recipes.json`, commit, push.
Vercel deploys in about a minute.

```json
{
  "id": "cacio-e-pepe",
  "title": "Cacio e Pepe",
  "category": "pasta",
  "defaultServes": 2,
  "time": 20,
  "source": { "label": "NYT Cooking", "url": "https://cooking.nytimes.com/..." },
  "ingredients": [
    { "qty": 1,   "name": "lb spaghetti or tonnarelli" },
    { "qty": 2,   "name": "tsp whole black peppercorns, coarsely cracked", "scale": "season" },
    { "qty": 1.5, "name": "cups pasta water, reserved", "scale": "fixed" }
  ],
  "steps": ["…", "…"],
  "tips": [{ "step": 5, "text": "…" }, { "step": 3, "text": "…" }]
}
```

1. **Normalize to 4 servings.** All quantities are stored for 4 servings (`BASE = 4` in the
   script); the Servings control scales from there. For baked goods that means dividing a
   full-pan recipe down (e.g. a 12-serving 9×14 pan ÷ 3) and noting the pan size for the
   original yield in the first step. Prefer units that stay readable at 1 serving: tbsp
   rather than cup for anything under ½ cup at 4 servings, since fmtQty shows `0` below ⅛.
2. **`category`** is one of: `seafood`, `chicken`, `beef`, `pasta`, `soup`, `breakfast`,
   `dessert`, `vegetarian`, `baking` (breads, cornbread, and other baked sides). Chicken
   dishes are `chicken`; if turkey or duck ever appear, add a specific category rather
   than a generic poultry one. Each has a stock color (`--stock` rule in the front CSS), an
   icon `<symbol id="icon-NAME">` in the sprite at the top of `<body>`, and a label in
   `CATEGORY_LABELS` in the script. Add all three for a new category.
3. **`defaultServes`**: the recipe view opens at this count. Use 2 for a weeknight dinner for
   the user's household, 4 for batch dishes (soups, stews, sauces, curries, meatballs, a whole
   Wellington), and the full original yield for baking and desserts (e.g. cornbread 12).
4. **`time`**: rough start-to-finish minutes including chilling or a short marinade, shown on
   the tile as "35 min" or "1 hr 45 min". Leave out overnight steps.
5. **`source`** (optional). If the recipe came from somewhere (NYT Cooking, Allrecipes, Serious
   Eats, a cookbook), give `label` and, when there is one, `url`; it shows on the tile front
   and in the recipe header. Ask for the source if the user doesn't give one. Recipes the user
   wrote, built with ChatGPT, or asked Claude to compose from general knowledge get no source.
6. **`ingredients`**: one flat list; the card splits it into two columns.
   - **Leave out pantry staples that aren't measured into the dish.** Oil that only greases
     the pan for searing or sautéing is not an ingredient; oil mixed into a batter or a sauce
     (scampi, cornbread) is. "Salt, to taste" is not an ingredient; a measured salt
     (`¼ tsp salt`) or a specialty salt (`½ tsp kosher salt`) is. The steps still say
     "heat the oil" and "season to taste" as normal.
   - `qty` is a number for 4 servings; `name` is everything after the number. Units the
     converter understands, when they lead `name`: `tbsp`, `tsp`, `oz`, `fl oz`, `lb`/`lbs`,
     `cup`/`cups`, `g`, `kg`, `ml`. Countable items (eggs, cloves) have no unit and get
     singularized automatically at quantity 1, so write countable names **plural**
     (`eggs, beaten`, `onions, diced`). Canned goods are given in `oz` with the word `canned`
     in the name so they never flip to pounds: `"oz canned diced tomatoes"`.
   - **`scale`** (default linear). Tag anything that shouldn't simply multiply:
     - `season` — salt, pepper, dried spices, flakes, Worcestershire, Dijon, sauté oil. Scales by ratio^0.7.
     - `fixed` — pan-dependent: poaching vinegar, reserved pasta water, "a pinch of".
     - `whole` — countables that can't be split (eggs). Default for integer countables anyway.
     - `half` — countables that halve sensibly: chicken breasts, onions, shallots, lemons, limes, peppers.
     Customary amounts are then snapped to kitchen measures (tsp → tbsp at 3 tsp, tbsp → cup at
     ¼ cup, oz → lb at 32 oz, under ⅛ tsp becomes "Pinch of"), so pick units freely.
7. **`steps`**: 5–7 strings, one sentence or two each. The cook overlay reads times like
   "3 min", "1–2 min", "30 seconds", "1 hour" out of step text to offer a timer, so keep
   times in that form. Plain text only; no HTML.
   **Quantities in step text scale too.** Write them as `{qty|name|scale}` with the same
   qty/name/scale conventions as an ingredient: `Sear in {1|tbsp butter} and oil`,
   `Butter {4|ramekins}`, `add up to {0.5|tsp sugar|season}`. Tag amounts that should follow
   the servings count (a portion of a divided ingredient, pan or patty counts). Leave times,
   temperatures, sizes ("1½-inch balls"), and pan-dependent amounts ("1 cup pasta water")
   as plain text.
8. **`tips`**: exactly two, each with the 1-based `step` it belongs to; the cook overlay shows
   the tip beneath that step.
9. **Search** indexes title, ingredient names, and category. Nothing else to update.
11. **Spelling:** American English everywhere (color, flavor, favorite, check/uncheck).
10. `sw.js` fetches `recipes.json` network-first, so new recipes need no cache bump. Bump
   `CACHE_VERSION` only when a file that is already cached under the same name changes
   (fonts, vendor JS, icons, sw.js).

## "What can I make?"

A basket icon button in the header (left of the settings gear) opens `#pantry-overlay`: a
checklist of every distinct ingredient across the deck, with recipes you can make (all
non-optional ingredients checked) and "Almost there" (missing 1–2) updating live. Checked state
persists in `localStorage` under `recipes.pantry.v2`. Only the short `STAPLES` list starts
checked (salt, pepper, olive oil, butter, eggs, milk, flour, sugar, garlic, onion). "Spices &
seasonings" and "Pantry & condiments" are unchecked groups with a Select all / Clear control
(`SELECT_ALL`).

Ingredient identity comes from `ingredientKey(data-name)` in the script: units and prep words
are stripped, then an `ALIASES` table maps variants to one canonical key (`unsalted butter` →
`butter`, `chicken broth` → `chicken stock`, `egg yolks` → `eggs`). `STAPLES` lists keys assumed
on hand; `GROUPS` sorts the rest into Spices & seasonings / Pantry & condiments / Proteins /
Produce / Dairy & cheese, else Other; `LABELS`
fixes capitalization of proper nouns. Names containing "optional" are ignored for matching.

**When adding a recipe**, check what its ingredients key to. The app script runs inside
`main()`, so from the console use the DOM: open the pantry and look for the new names under
"Other", or temporarily log `ingredientKey(name)` from inside the script.
A new ingredient that keys to something wrong or too specific needs an `ALIASES` entry. Every
other new key belongs in a `GROUPS` set (spice, pantry item, protein, produce, dairy) so it
doesn't fall into Other; add to `STAPLES` only for something nearly every kitchen has.

## Verifying visually

Headless Chrome is at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
Its window clamps to ~485px wide, so for phone-width shots load the page in a 390px iframe
rather than passing `--window-size=390`. `requestAnimationFrame` does not tick in headless,
so stub it before exercising html2canvas (the share export).
