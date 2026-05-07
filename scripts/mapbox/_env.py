"""Shared environment / token loading for the Mapbox scripts."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]


def load_token() -> str:
    """Resolve the Mapbox secret token from .env.local or the environment."""
    load_dotenv(REPO_ROOT / ".env.local", override=False)

    token = os.environ.get("MAPBOX_SECRET_TOKEN")
    if not token:
        sys.stderr.write(
            "ERROR: MAPBOX_SECRET_TOKEN is not set.\n"
            "       Add it to .env.local or export it before running.\n"
        )
        sys.exit(2)

    if not token.startswith("sk."):
        sys.stderr.write(
            "ERROR: MAPBOX_SECRET_TOKEN must be a SECRET token (starts with 'sk.').\n"
        )
        sys.exit(2)

    # mapbox-tilesets CLI also reads this env var name.
    os.environ["MAPBOX_ACCESS_TOKEN"] = token
    return token
