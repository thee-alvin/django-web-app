from pathlib import Path
from app.config.data_paths import DATA_DIR

BASE_DIR = Path(__file__).resolve().parents[2]

CONSTITUTION_PDF = (
    DATA_DIR / "documents" / "TLC_Constitution.pdf"
)

CONSTITUTION_TEXT = (
    DATA_DIR / "documents" / "TLC_Constitution.txt"
)


def constitution_exists():
    return CONSTITUTION_TEXT.exists()


def get_constitution_text():
    if not CONSTITUTION_TEXT.exists():
        return ""

    return CONSTITUTION_TEXT.read_text(
        encoding="utf-8"
    )
