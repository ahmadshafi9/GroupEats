from dataclasses import dataclass
from typing import List, Optional


@dataclass
class CodeUnit:
    """
    Represents a single extracted code unit (e.g. a function).

    All line numbers are 1-based, inclusive.
    """

    file: str
    name: Optional[str]
    start_line: int
    end_line: int
    source_text: str


def extract_units(file_path: str, source_code: str) -> List[CodeUnit]:
    """
    Generic extractor interface.

    Phase 2 implementation is language-specific and lives in
    extractors/javascript.py; this function is a convenience wrapper
    that delegates based on file extension.
    """
    from .javascript import extract_units as js_extract_units

    lower = file_path.lower()
    if lower.endswith((".js", ".jsx", ".ts", ".tsx")):
        return js_extract_units(file_path, source_code)
    return []

