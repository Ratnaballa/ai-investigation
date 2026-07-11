"""
pytest configuration
====================
Adds the backend root to sys.path so all app.* imports resolve correctly
when running pytest from the backend/ directory.
"""
import sys
from pathlib import Path

# Ensure `app` package is importable
sys.path.insert(0, str(Path(__file__).parent))
