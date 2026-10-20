import os
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.getenv("TLC_DATA_DIR", str(PROJECT_DIR / "data")))
if not DATA_DIR.is_absolute():
    DATA_DIR = (PROJECT_DIR / DATA_DIR).resolve()
