# Mapbox upload pipeline

Two `uv`-managed scripts that own the Mapbox account for this app:

- `**pipeline.py**` — converts the source files in your data directory into
MTS-ready line-delimited GeoJSON, uploads them as tileset sources, writes a
recipe per tileset, and publishes. Idempotent.
- `**wipe_account.py**` — paginates through every tileset and tileset-source
in the account and deletes them, except for the IDs declared in
`manifest.py`.

Both scripts share the manifest in `[manifest.py](./manifest.py)`, which is the
single source of truth for what should exist in Mapbox.

## Prerequisites

1. `[uv](https://docs.astral.sh/uv/)` installed.
2. Your Mapbox **secret** token (`sk....`) in `.env.local` at the repo root:
  ```
   MAPBOX_SECRET_TOKEN="sk.your-token-here"
  ```
   The token must have the `tilesets:write`, `tilesets:read`, and
   `tilesets:list` scopes.
3. A directory holding the supersection shapefiles and 8km TIFFs the manifest
  references. The directory is **not** versioned — point at it with
   `--data-dir` or `MAPBOX_DATA_DIR`. Filenames inside it must match the
   relative paths declared in `manifest.py`.

## One-time setup

```bash
cd scripts/mapbox
uv sync
```

## Upload all 12 tilesets

```bash
# explicit path
uv run python pipeline.py --data-dir /path/to/new_data

# or via env var (handy for repeated runs)
export MAPBOX_DATA_DIR=/path/to/new_data
uv run python pipeline.py
```

Re-running is safe — sources are replaced in place and tilesets republished.

Useful flags:

- `--only allrisk_supersection_ssp245 bufferpool_drought_ssp245` — restrict to
specific manifest entries.
- `--skip-convert` — reuse the GeoJSON in `.build/` instead of regenerating
(the data directory still has to be supplied for any spec that needs
re-conversion).

## Wipe everything else from Mapbox

After verifying the new tilesets work in the app, run:

```bash
uv run python wipe_account.py --dry-run    # preview
uv run python wipe_account.py              # interactive: type WIPE to confirm
uv run python wipe_account.py --yes        # for CI / no prompt
```

The 12 IDs in `manifest.py` are protected, so re-running this after
`pipeline.py` will never delete the data the React app relies on.

`wipe_account.py` does not need `--data-dir` — it only talks to the Mapbox
API.

## Adding a new layer

1. Drop the source file into your data directory.
2. Add a `TilesetSpec(...)` entry to `[manifest.py](./manifest.py)` — `source`
  must be a path *relative to the data directory*.
3. Add the matching entry to
  `[src/config/mapboxLayers.ts](../../src/config/mapboxLayers.ts)` so the
   React app knows about the tileset, source-layer name, and which property
   to color by.
4. `uv run python pipeline.py --data-dir /path/to/new_data --only <new_id>`.

