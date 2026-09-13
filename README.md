# GD Creator

A React item browser for normalized Grim Dawn data.

## Run the app

```bash
npm install
npm run dev
```

The current dev server is available at `http://localhost:5174/` in this workspace.

## Import items

The importer accepts either a JSON export or a directory containing extracted `.dbr` records:

```bash
npm run import:items
npm run import:items -- path/to/extracted/items public/data/items.json
npm run import:items -- path/to/extracted/items public/data/items.json path/to/tags_items.txt
npm run import:items -- path/to/extracted/items public/data/items.json path/to/text_en
```

The default input is `data/source/items.json`; the output is one complete database at `public/data/items.json`. The Vite server exposes `/api/items`, which filters and paginates that file server-side so the browser receives only the current page. JSON can be an array, an object with an `items` array, or a single record. `.dbr` key/value fields are mapped to the normalized item shape and unknown scalar fields are retained under `stats`.

The database records contain localization keys such as `tagDLCConsumableA02`, not the visible name. Extract the language/tag files with the asset tool and pass either a single tag file or the complete directory as the third argument. The importer merges all `tags_*.txt` files when given a directory. Bitmap paths such as `items/dlc/bitmaps/foo.tex` are emitted as `/assets/items/dlc/bitmaps/foo.png`.

Grim Dawn's `database.arz` and asset archives should first be extracted with a compatible Grim Dawn modding/asset tool. The script intentionally operates on extracted records rather than implementing a parser for the proprietary container. The image converter writes bitmap PNGs below `public/assets/items/` while preserving the original resource path.

## Checks

```bash
npm run import:items
npm run lint
npm run build
```
