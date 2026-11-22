#!/usr/bin/env python3
"""OpenSourceMate (OSM) CLI Script Runner.

Execute directly from repository root:
    python scripts/osm.py analyze <username>
    python scripts/osm.py analyze <username> --json
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from osm.cli import main

if __name__ == "__main__":
    sys.exit(main())
