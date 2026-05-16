"""Single source of truth for the Mapbox tilesets owned by this app.

Both the upload pipeline (`pipeline.py`) and the account wipe (`wipe_account.py`)
import this manifest. The TypeScript registry (`src/config/mapboxLayers.ts`) is
written by hand to mirror it; whenever the manifest changes, update the registry
to match (the React app must agree on `tileset` and `source_layer`).

Source paths are stored RELATIVE to a "data root" so the actual files can live
anywhere on disk. Callers (pipeline.py) supply the data root via
``--data-dir`` or the ``MAPBOX_DATA_DIR`` env var and use
``resolve_source(data_dir, spec)`` to obtain the absolute path.
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Literal

BUILD_DIR = Path(__file__).resolve().parent / ".build"

MAPBOX_USERNAME = "pkulandh"

SourceKind = Literal["raster", "shapefile"]
Scope = Literal["us", "global"]


@dataclass(frozen=True)
class TilesetSpec:
    """Describes one Mapbox tileset and the recipe used to build it."""

    tileset_id: str  # bare name, e.g. "allrisk_supersection_ssp245"
    source: Path  # path RELATIVE to the data root supplied by the caller
    kind: SourceKind
    source_layer: str  # the layer name inside the published tileset
    scope: Scope
    minzoom: int = 0
    maxzoom: int = 8
    # For shapefiles: only these attribute names survive into the tiles.
    keep_properties: tuple[str, ...] = field(default_factory=tuple)
    # For rasters: pixel value goes into this property name.
    raster_property: str = "value"
    # For rasters: skip pixels equal to or below this value (after nodata).
    raster_min_value: float = 0.0

    @property
    def full_id(self) -> str:
        return f"{MAPBOX_USERNAME}.{self.tileset_id}"

    @property
    def source_id(self) -> str:
        # MTS source id; reused per tileset so re-runs replace in place.
        return self.tileset_id


# Property names retained from the supersection .dbf.
# `SSectin` carries the human-readable region name (e.g. "Okanogan Highland");
# the pipeline renames it to `region` before it reaches the tiles.
SUPERSECTION_PROPS = (
    "SSectin",
    "frtrs__",
    "drtrs__",
    "insrs__",
    "cmbrs__",
    "cmbsm__",
)


TILESETS: tuple[TilesetSpec, ...] = (
    # ------------------------------------------------------------------ US
    # Combined risk + per-driver reversal probability live in one tileset
    # per SSP; the React app picks which numeric column to color by.
    TilesetSpec(
        tileset_id="allrisk_supersection_ssp245",
        source=Path(
            "allRisk_delReversal_supersection_ssp245_select"
        )
        / "allRisk_delReversal_supersection_ssp245_select.shp",
        kind="shapefile",
        source_layer="allrisk_supersection_ssp245",
        scope="us",
        maxzoom=10,
        keep_properties=SUPERSECTION_PROPS,
    ),
    TilesetSpec(
        tileset_id="allrisk_supersection_ssp370",
        source=Path(
            "allRisk_delReversal_supersection_ssp370_select"
        )
        / "allRisk_delReversal_supersection_ssp370_select.shp",
        kind="shapefile",
        source_layer="allrisk_supersection_ssp370",
        scope="us",
        maxzoom=10,
        keep_properties=SUPERSECTION_PROPS,
    ),
    TilesetSpec(
        tileset_id="allrisk_supersection_ssp585",
        source=Path(
            "allRisk_delReversal_supersection_ssp585_select"
        )
        / "allRisk_delReversal_supersection_ssp585_select.shp",
        kind="shapefile",
        source_layer="allrisk_supersection_ssp585",
        scope="us",
        maxzoom=10,
        keep_properties=SUPERSECTION_PROPS,
    ),
    # US Buffer Pool 8km grids (per-driver, ssp245 only)
    TilesetSpec(
        tileset_id="bufferpool_drought_ssp245",
        source=Path("drought_bufferPool_8km_ssp245.tif"),
        kind="raster",
        source_layer="bufferpool_drought_ssp245",
        scope="us",
        maxzoom=10,
    ),
    TilesetSpec(
        tileset_id="bufferpool_fire_ssp245",
        source=Path("fire_bufferPool_8km_ssp245.tif"),
        kind="raster",
        source_layer="bufferpool_fire_ssp245",
        scope="us",
        maxzoom=10,
    ),
    TilesetSpec(
        tileset_id="bufferpool_insect_ssp245",
        source=Path("insect_bufferPool_8km_ssp245.tif"),
        kind="raster",
        source_layer="bufferpool_insect_ssp245",
        scope="us",
        maxzoom=10,
    ),
    # ------------------------------------------------------------- Global
    TilesetSpec(
        tileset_id="globalbufferpool_low_ssp245",
        source=Path("globalBufferPolls_low_8km_ssp245_resetallAgeRevision.tif"),
        kind="raster",
        source_layer="globalbufferpool_low_ssp245",
        scope="global",
        maxzoom=8,
    ),
    TilesetSpec(
        tileset_id="globalbufferpool_moderate_ssp245",
        source=Path(
            "globalBufferPolls_moderate_8km_ssp245_resetallAgeRevision.tif"
        ),
        kind="raster",
        source_layer="globalbufferpool_moderate_ssp245",
        scope="global",
        maxzoom=8,
    ),
    TilesetSpec(
        tileset_id="globalbufferpool_high_ssp245",
        source=Path("globalBufferPolls_high_8km_ssp245_resetallAgeRevision.tif"),
        kind="raster",
        source_layer="globalbufferpool_high_ssp245",
        scope="global",
        maxzoom=8,
    ),
    TilesetSpec(
        tileset_id="globalreversal_low_ssp245",
        source=Path("globalReversal_low_8km_ssp245_resetallAgeRevision.tif"),
        kind="raster",
        source_layer="globalreversal_low_ssp245",
        scope="global",
        maxzoom=8,
    ),
    TilesetSpec(
        tileset_id="globalreversal_moderate_ssp245",
        source=Path("globalReversal_moderate_8km_ssp245_resetallAgeRevision.tif"),
        kind="raster",
        source_layer="globalreversal_moderate_ssp245",
        scope="global",
        maxzoom=8,
    ),
    TilesetSpec(
        tileset_id="globalreversal_high_ssp245",
        source=Path("globalReversal_high_8km_ssp245_resetallAgeRevision.tif"),
        kind="raster",
        source_layer="globalreversal_high_ssp245",
        scope="global",
        maxzoom=8,
    ),
)


def resolve_data_dir(arg: str | None) -> Path:
    """Pick a data directory from the CLI arg, env var, or fail loudly."""
    raw = arg or os.environ.get("MAPBOX_DATA_DIR")
    if not raw:
        sys.stderr.write(
            "ERROR: data directory is required.\n"
            "  Pass --data-dir /path/to/new_data,\n"
            "  or export MAPBOX_DATA_DIR=/path/to/new_data.\n"
        )
        sys.exit(2)
    path = Path(raw).expanduser().resolve()
    if not path.is_dir():
        sys.stderr.write(f"ERROR: data directory does not exist: {path}\n")
        sys.exit(2)
    return path


def resolve_source(data_dir: Path, spec: TilesetSpec) -> Path:
    """Join the manifest's relative source path against the chosen data root."""
    if spec.source.is_absolute():
        sys.stderr.write(
            f"ERROR: spec {spec.tileset_id} has an absolute source path; "
            "manifest paths must be relative to the data root.\n"
        )
        sys.exit(2)
    resolved = (data_dir / spec.source).resolve()
    if not resolved.exists():
        sys.stderr.write(
            f"ERROR: source file missing for {spec.tileset_id}: {resolved}\n"
        )
        sys.exit(2)
    return resolved


def protected_tileset_ids() -> set[str]:
    """Full Mapbox tileset IDs that the wipe script must NEVER delete."""
    return {spec.full_id for spec in TILESETS}


def protected_source_ids() -> set[str]:
    """MTS source IDs that the wipe script must NEVER delete."""
    return {spec.source_id for spec in TILESETS}


def manifest_as_json() -> str:
    """Serialise the manifest for inspection / sharing with the React app."""

    def encode(obj):
        if isinstance(obj, Path):
            return str(obj)
        raise TypeError(f"Unhandled type: {type(obj)}")

    return json.dumps(
        [asdict(spec) for spec in TILESETS],
        indent=2,
        default=encode,
    )


if __name__ == "__main__":
    print(manifest_as_json())
