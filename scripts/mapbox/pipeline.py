"""Upload every tileset declared in `manifest.py` to Mapbox using MTS.

For each entry:

  1. Convert the source TIFF / .shp into line-delimited GeoJSON in WGS84.
  2. Upload it to MTS as a tileset source (`mapbox tilesets upload-source`).
  3. Write a vector recipe pointing at that source.
  4. `mapbox tilesets create` (or `update-recipe` if the tileset already exists).
  5. `mapbox tilesets publish` and wait for the job to finish.

The script is idempotent: re-running it replaces the source in place and
publishes a new tileset version.

The data directory holding the input TIFFs / shapefiles is supplied by the
caller via ``--data-dir`` or the ``MAPBOX_DATA_DIR`` environment variable —
nothing about the input data location is hardcoded.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

import fiona
import httpx
import rasterio
from pyproj import Transformer
from rasterio.features import shapes as raster_shapes
from rasterio.warp import transform_geom
from shapely.geometry import mapping, shape
from tqdm import tqdm

from _env import load_token
from manifest import (
    BUILD_DIR,
    MAPBOX_USERNAME,
    TILESETS,
    TilesetSpec,
    resolve_data_dir,
    resolve_source,
)


def _ldjson_path(spec: TilesetSpec) -> Path:
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    return BUILD_DIR / f"{spec.tileset_id}.geojson.ld"


def _write_feature(handle, geometry: dict, properties: dict) -> None:
    handle.write(
        json.dumps(
            {
                "type": "Feature",
                "geometry": geometry,
                "properties": properties,
            },
            separators=(",", ":"),
        )
    )
    handle.write("\n")


def convert_raster(spec: TilesetSpec, source_path: Path) -> Path:
    """Polygonise a TIFF into one Feature per non-nodata pixel run."""
    out = _ldjson_path(spec)
    with rasterio.open(source_path) as src:
        nodata = src.nodata
        band = src.read(1)
        mask = band > spec.raster_min_value
        if nodata is not None:
            mask &= band != nodata

        transformer = (
            None
            if src.crs.to_epsg() == 4326
            else lambda geom: transform_geom(src.crs, "EPSG:4326", geom)
        )

        count = 0
        with out.open("w", encoding="utf-8") as handle:
            for geom, value in raster_shapes(band, mask=mask, transform=src.transform):
                if transformer is not None:
                    geom = transformer(geom)
                _write_feature(
                    handle,
                    geom,
                    {spec.raster_property: float(value)},
                )
                count += 1
    print(f"  -> {count:,} polygons written to {out.name}")
    return out


def convert_shapefile(spec: TilesetSpec, source_path: Path) -> Path:
    """Stream a shapefile into line-delimited GeoJSON in WGS84."""
    from shapely.ops import transform as shp_transform

    out = _ldjson_path(spec)
    with fiona.open(source_path) as src:
        src_epsg = src.crs.to_epsg() if src.crs else None
        if src_epsg == 4326:
            transformer = None
        else:
            src_wkt = src.crs.to_wkt() if src.crs else None
            transformer = (
                Transformer.from_crs(src_wkt, "EPSG:4326", always_xy=True)
                if src_wkt
                else None
            )

        keep = set(spec.keep_properties)
        count = 0
        with out.open("w", encoding="utf-8") as handle:
            for feature in src:
                geom = feature["geometry"]
                if geom is None:
                    continue
                if transformer is not None:
                    shapely_geom = shape(dict(geom))
                    shapely_geom = shp_transform(transformer.transform, shapely_geom)
                    geom = mapping(shapely_geom)
                else:
                    geom = dict(geom)

                props = {
                    k: v
                    for k, v in (
                        dict(feature["properties"]) if feature["properties"] else {}
                    ).items()
                    if not keep or k in keep
                }
                if "SSectin" in props:
                    props["region"] = props.pop("SSectin")
                _write_feature(handle, geom, props)
                count += 1
    print(f"  -> {count:,} features written to {out.name}")
    return out


def convert(spec: TilesetSpec, source_path: Path) -> Path:
    if spec.kind == "raster":
        return convert_raster(spec, source_path)
    return convert_shapefile(spec, source_path)


def write_recipe(spec: TilesetSpec) -> Path:
    recipe = {
        "version": 1,
        "layers": {
            spec.source_layer: {
                "source": f"mapbox://tileset-source/{MAPBOX_USERNAME}/{spec.source_id}",
                "minzoom": spec.minzoom,
                "maxzoom": spec.maxzoom,
            }
        },
    }
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    path = BUILD_DIR / f"{spec.tileset_id}.recipe.json"
    path.write_text(json.dumps(recipe, indent=2))
    return path


def run_cli(*args: str) -> str:
    """Invoke the `tilesets` CLI and return stdout (raises on non-zero exit)."""
    result = subprocess.run(
        ["tilesets", *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def tileset_exists(client: httpx.Client, full_id: str, token: str) -> bool:
    r = client.get(
        f"https://api.mapbox.com/tilesets/v1/{full_id}?access_token={token}"
    )
    if r.status_code == 200:
        return True
    if r.status_code == 404:
        return False
    r.raise_for_status()
    return False


def upload_one(
    spec: TilesetSpec,
    source_path: Path,
    client: httpx.Client,
    token: str,
) -> None:
    print(f"\n=== {spec.full_id} ({spec.kind}) ===")
    print(f"  source: {source_path}")

    ldjson = convert(spec, source_path)
    recipe = write_recipe(spec)

    print(f"  uploading source -> {spec.source_id}")
    run_cli(
        "upload-source",
        "--replace",
        MAPBOX_USERNAME,
        spec.source_id,
        str(ldjson),
    )

    if tileset_exists(client, spec.full_id, token):
        print(f"  updating recipe for {spec.full_id}")
        run_cli("update-recipe", spec.full_id, str(recipe))
    else:
        print(f"  creating tileset {spec.full_id}")
        run_cli(
            "create",
            spec.full_id,
            "--recipe",
            str(recipe),
            "--name",
            spec.tileset_id,
        )

    print(f"  publishing {spec.full_id}")
    job_output = run_cli("publish", spec.full_id)
    print(f"  job: {job_output}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--data-dir",
        metavar="PATH",
        help=(
            "Directory containing the source TIFFs and shapefiles. "
            "Falls back to the MAPBOX_DATA_DIR env var. Required."
        ),
    )
    parser.add_argument(
        "--only",
        nargs="*",
        metavar="TILESET_ID",
        help="Restrict to specific manifest tileset IDs (bare names).",
    )
    parser.add_argument(
        "--skip-convert",
        action="store_true",
        help="Reuse previously generated GeoJSON in .build/ instead of regenerating.",
    )
    args = parser.parse_args()

    data_dir = resolve_data_dir(args.data_dir)
    token = load_token()

    selected: tuple[TilesetSpec, ...] = TILESETS
    if args.only:
        wanted = set(args.only)
        selected = tuple(spec for spec in TILESETS if spec.tileset_id in wanted)
        missing = wanted - {spec.tileset_id for spec in selected}
        if missing:
            sys.stderr.write(f"Unknown tileset id(s): {sorted(missing)}\n")
            sys.exit(2)

    print(
        f"Uploading {len(selected)} tileset(s) to {MAPBOX_USERNAME} "
        f"from {data_dir}..."
    )
    with httpx.Client(timeout=60.0) as client:
        for spec in tqdm(selected, desc="tilesets", unit="tileset"):
            cached = _ldjson_path(spec)
            if args.skip_convert and cached.exists():
                print(f"\n=== {spec.full_id} (reusing cached geojson) ===")
                recipe = write_recipe(spec)
                run_cli(
                    "upload-source",
                    "--replace",
                    MAPBOX_USERNAME,
                    spec.source_id,
                    str(cached),
                )
                if tileset_exists(client, spec.full_id, token):
                    run_cli("update-recipe", spec.full_id, str(recipe))
                else:
                    run_cli(
                        "create",
                        spec.full_id,
                        "--recipe",
                        str(recipe),
                        "--name",
                        spec.tileset_id,
                    )
                run_cli("publish", spec.full_id)
                continue
            source_path = resolve_source(data_dir, spec)
            upload_one(spec, source_path, client, token)

    print("\nDone. Poll status with: tilesets status <USERNAME.TILESET>")
    time.sleep(0.1)


if __name__ == "__main__":
    main()
