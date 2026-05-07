"""Delete every tileset and tileset-source from the Mapbox account.

The 12 IDs declared in `manifest.py` are protected, so this is safe to run
*after* `pipeline.py` has uploaded the modern data.

Set `--yes` to skip the interactive `WIPE` confirmation (for automation).
"""

from __future__ import annotations

import argparse
import sys
import time

import httpx

from _env import load_token
from manifest import (
    MAPBOX_USERNAME,
    protected_source_ids,
    protected_tileset_ids,
)


API = "https://api.mapbox.com"


def _with_token(url: str, token: str) -> str:
    """Append the access_token query param without clobbering the existing query."""
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}access_token={token}"


def list_tilesets(client: httpx.Client, token: str) -> list[dict]:
    out: list[dict] = []
    url: str | None = (
        f"{API}/tilesets/v1/{MAPBOX_USERNAME}?limit=500&sortby=created"
    )
    page = 0
    while url:
        page += 1
        # NOTE: passing `params=` to httpx replaces the URL's query string in
        # 0.28+, so we splice the token into the URL ourselves.
        r = client.get(_with_token(url, token))
        r.raise_for_status()
        batch = r.json()
        out.extend(batch)
        print(f"  page {page}: +{len(batch)} (total {len(out)})", flush=True)
        url = None
        link = r.headers.get("link")
        if link and 'rel="next"' in link:
            # Format: <https://api.mapbox.com/...>; rel="next"
            url = link.split("<", 1)[1].split(">", 1)[0]
    return out


def list_sources(client: httpx.Client, token: str) -> list[dict]:
    out: list[dict] = []
    url: str | None = (
        f"{API}/tilesets/v1/sources/{MAPBOX_USERNAME}?limit=500"
    )
    page = 0
    while url:
        page += 1
        r = client.get(_with_token(url, token))
        r.raise_for_status()
        batch = r.json()
        out.extend(batch)
        print(f"  source page {page}: +{len(batch)} (total {len(out)})", flush=True)
        url = None
        link = r.headers.get("link")
        if link and 'rel="next"' in link:
            url = link.split("<", 1)[1].split(">", 1)[0]
    return out


def delete_tileset(client: httpx.Client, full_id: str, token: str) -> tuple[int, str]:
    r = client.delete(_with_token(f"{API}/tilesets/v1/{full_id}", token))
    return r.status_code, r.text[:200]


def delete_source(client: httpx.Client, source_id: str, token: str) -> tuple[int, str]:
    # Source IDs come back from the API already prefixed with mapbox://...
    bare = source_id.split("/")[-1]
    r = client.delete(
        _with_token(
            f"{API}/tilesets/v1/sources/{MAPBOX_USERNAME}/{bare}", token
        )
    )
    return r.status_code, r.text[:200]


def confirm(prompt: str) -> bool:
    sys.stdout.write(prompt)
    sys.stdout.flush()
    try:
        answer = input().strip()
    except EOFError:
        return False
    return answer == "WIPE"


def fmt_size(n: int | float) -> str:
    if not n:
        return "0 B"
    units = ["B", "KB", "MB", "GB"]
    i = 0
    n = float(n)
    while n >= 1024 and i < len(units) - 1:
        n /= 1024
        i += 1
    return f"{n:6.2f} {units[i]}"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--yes", action="store_true", help="Skip the typed confirmation prompt."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List what would be deleted, then exit.",
    )
    args = parser.parse_args()

    token = load_token()
    protected_ts = protected_tileset_ids()
    protected_src = protected_source_ids()

    with httpx.Client(timeout=60.0) as client:
        print(f"Listing tilesets in {MAPBOX_USERNAME}...")
        tilesets = list_tilesets(client, token)
        print(f"Listing tileset sources in {MAPBOX_USERNAME}...")
        sources = list_sources(client, token)

        ts_to_delete = [t for t in tilesets if t["id"] not in protected_ts]
        # API returns sources with id like "mapbox://tileset-source/USER/NAME"
        src_to_delete = [
            s
            for s in sources
            if s["id"].split("/")[-1] not in protected_src
        ]

        total_bytes = sum(t.get("filesize", 0) for t in ts_to_delete)

        print(
            f"\nFound {len(tilesets)} tileset(s); "
            f"{len(ts_to_delete)} will be DELETED, "
            f"{len(tilesets) - len(ts_to_delete)} protected."
        )
        print(
            f"Found {len(sources)} source(s); "
            f"{len(src_to_delete)} will be DELETED, "
            f"{len(sources) - len(src_to_delete)} protected."
        )
        print(f"Approximate tileset bytes to be freed: {fmt_size(total_bytes)}\n")

        if ts_to_delete:
            print("Tilesets to delete (first 30):")
            for t in ts_to_delete[:30]:
                print(f"  {t['id']:55s}  {fmt_size(t.get('filesize', 0))}")
            if len(ts_to_delete) > 30:
                print(f"  ... and {len(ts_to_delete) - 30} more")

        if src_to_delete:
            print("\nSources to delete (first 10):")
            for s in src_to_delete[:10]:
                print(f"  {s['id']}")
            if len(src_to_delete) > 10:
                print(f"  ... and {len(src_to_delete) - 10} more")

        if args.dry_run:
            print("\n--dry-run: nothing was deleted.")
            return

        if not args.yes:
            ok = confirm(
                "\nType WIPE to permanently delete the items above: "
            )
            if not ok:
                print("Aborted.")
                sys.exit(1)

        ts_failures: list[tuple[str, int, str]] = []
        src_failures: list[tuple[str, int, str]] = []

        print(f"\nDeleting {len(ts_to_delete)} tileset(s)...", flush=True)
        for i, t in enumerate(ts_to_delete, 1):
            status, body = delete_tileset(client, t["id"], token)
            if status not in (200, 204):
                ts_failures.append((t["id"], status, body))
                print(f"  ! [{i}/{len(ts_to_delete)}] {t['id']} -> HTTP {status} {body}", flush=True)
            elif i % 25 == 0 or i == len(ts_to_delete):
                print(
                    f"  [{i}/{len(ts_to_delete)}] deleted (last: {t['id']})",
                    flush=True,
                )
            # Mapbox rate limit on tileset deletes is 200/min; throttle gently.
            time.sleep(0.05)

        print(f"\nDeleting {len(src_to_delete)} source(s)...", flush=True)
        for i, s in enumerate(src_to_delete, 1):
            status, body = delete_source(client, s["id"], token)
            if status not in (200, 201, 204):
                src_failures.append((s["id"], status, body))
                print(f"  ! {s['id']} -> HTTP {status} {body}", flush=True)
            elif i % 25 == 0 or i == len(src_to_delete):
                print(
                    f"  [{i}/{len(src_to_delete)}] deleted (last: {s['id']})",
                    flush=True,
                )
            time.sleep(0.05)

        deleted_ts = len(ts_to_delete) - len(ts_failures)
        deleted_src = len(src_to_delete) - len(src_failures)
        print(
            f"\nDone. Deleted {deleted_ts} tileset(s) and {deleted_src} source(s)."
        )
        if ts_failures or src_failures:
            print(
                f"  Failures: {len(ts_failures)} tileset(s), "
                f"{len(src_failures)} source(s)."
            )
            sys.exit(1)


if __name__ == "__main__":
    main()
