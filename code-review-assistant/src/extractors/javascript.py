import re
from typing import List, Optional

from .base import CodeUnit


_FUNC_DECL_RE = re.compile(r"^\s*function\s+(?P<name>[A-Za-z_$][A-Za-z0-9_$]*)\s*\(", re.MULTILINE)
_FUNC_EXPR_RE = re.compile(
    r"^\s*(?:const|let|var)\s+(?P<name>[A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?function\s*\(",
    re.MULTILINE,
)
_ARROW_FUNC_RE = re.compile(
    r"^\s*(?:const|let|var)\s+(?P<name>[A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>",
    re.MULTILINE,
)


def _find_block_end(lines: List[str], start_index: int) -> int:
    """
    Very small brace-matching helper to approximate the end of a function.

    Given the index of the line where a function definition starts, walk
    forward counting '{' and '}' characters until the brace depth returns
    to zero. If we never find a closing brace, fall back to the last line.
    """
    depth = 0
    saw_open = False
    for i in range(start_index, len(lines)):
        line = lines[i]
        for ch in line:
            if ch == "{":
                depth += 1
                saw_open = True
            elif ch == "}":
                depth -= 1
                if depth <= 0 and saw_open:
                    return i
    # Fallback: treat the rest of the file as the block
    return len(lines) - 1


def _make_unit(file_path: str, name: Optional[str], start_line: int, end_line: int, lines: List[str]) -> CodeUnit:
    source_text = "".join(lines[start_line - 1 : end_line])
    return CodeUnit(
        file=file_path,
        name=name,
        start_line=start_line,
        end_line=end_line,
        source_text=source_text,
    )


def extract_units(file_path: str, source_code: str) -> List[CodeUnit]:
    """
    Heuristic JavaScript/TypeScript extractor.

    Finds:
    - function declarations: `function name(...) { ... }`
    - function expressions: `const name = function(...) { ... }`
    - arrow functions: `const name = (...) => { ... }`

    This is intentionally conservative: it aims to find obvious function-like
    units rather than perfectly modelling every JS/TS construct.
    """
    if not source_code:
        return []

    lines = source_code.splitlines(keepends=True)
    text = source_code

    units: List[CodeUnit] = []

    def _add_matches(regex: re.Pattern) -> None:
        for match in regex.finditer(text):
            name = match.group("name")
            start_pos = match.start()
            start_line = text.count("\\n", 0, start_pos) + 1
            end_index = _find_block_end(lines, start_line - 1)
            end_line = end_index + 1
            units.append(_make_unit(file_path, name, start_line, end_line, lines))

    _add_matches(_FUNC_DECL_RE)
    _add_matches(_FUNC_EXPR_RE)
    _add_matches(_ARROW_FUNC_RE)

    # Deduplicate by (name, start_line) in case multiple regexes hit the same line
    seen = set()
    deduped: List[CodeUnit] = []
    for u in units:
        key = (u.name, u.start_line)
        if key not in seen:
            seen.add(key)
            deduped.append(u)

    return deduped

