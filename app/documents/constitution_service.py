from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]

CONSTITUTION_PDF = (
    BASE_DIR / "data" / "documents" / "TLC_Constitution.pdf"
)

CONSTITUTION_TEXT = (
    BASE_DIR / "data" / "documents" / "TLC_Constitution.txt"
)


def constitution_exists():
    return CONSTITUTION_TEXT.exists()


def get_constitution_text():
    if not CONSTITUTION_TEXT.exists():
        return ""

    return CONSTITUTION_TEXT.read_text(
        encoding="utf-8"
    )
