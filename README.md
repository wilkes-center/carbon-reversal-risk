# Carbon Reversal Risk Tool

An interactive Mapbox-based web app for exploring **carbon reversal risk** and **buffer pool** projections across the United States and globally, under multiple SSP climate scenarios.

The tool accompanies Wu et al. 2026 (Nature), and lets researchers and policymakers visualise where stored forest carbon is most vulnerable to fire, drought, and insect-driven reversal — and how that risk shifts under SSP245, SSP370, and SSP585 scenarios.

> Live deployment: [https://wilkes-center.github.io/carbon-reversal-risk/](https://wilkes-center.github.io/carbon-reversal-risk/)

---

## Getting started

### Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/) 10 (Corepack will pin the version from `package.json`'s `packageManager` field)
- A Mapbox **public** access token (`pk.…`) for the React app

### Install & run

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

---

## Environment variables

Create a `.env.local` in the repo root:

```env
# Required by the React app (Mapbox GL JS)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your-public-token"

# Required ONLY by scripts/mapbox/ to upload tilesets.
# Needs scopes: tilesets:write, tilesets:read, tilesets:list
MAPBOX_SECRET_TOKEN="sk.your-secret-token"

# Optional. Hide the "Global Layers" panel section even when global
# tilesets are registered. Defaults to showing the section.
NEXT_PUBLIC_HIDE_GLOBAL_LAYERS=true
```

`.env*.local` is gitignored. Never commit `sk.…` secret tokens.

---

## Mapbox tilesets

Tilesets are owned and rebuilt by a small Python pipeline in `[scripts/mapbox/](scripts/mapbox/)`, driven by `uv`:

```bash
cd scripts/mapbox
uv sync
uv run python pipeline.py --data-dir /path/to/new_data
```

`pipeline.py` is idempotent: it converts each shapefile / GeoTIFF into MTS-ready line-delimited GeoJSON, replaces the tileset source in place, writes a recipe, and republishes. `wipe_account.py` clears every tileset and source from the account *except* the IDs declared in `manifest.py`, making it safe to run after a partial upload to clean up orphans.

See `[scripts/mapbox/README.md](scripts/mapbox/README.md)` for the full workflow, troubleshooting, and `--only` / `--skip-convert` options.

### Adding a new layer

1. Drop the source file (shapefile or GeoTIFF) into your data directory.
2. Add a `TilesetSpec` entry to `[scripts/mapbox/manifest.py](scripts/mapbox/manifest.py)` — `source` is a path *relative to the data directory*.
3. Mirror the new tileset id in `[src/config/mapboxLayers.ts](src/config/mapboxLayers.ts)`, choosing the group, label, value property, color scale, and scope.
4. `uv run python pipeline.py --data-dir /path/to/new_data --only <new_id>`.

That's it. The panel layout, color ramp, popup, area stats, CSV download, and dark-mode handling all read straight from the registry — no other files need to change.