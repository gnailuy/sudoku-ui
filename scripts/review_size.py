#!/usr/bin/env python3
"""Emit non-blocking review signals for unusually large maintained web sources."""

from __future__ import annotations

from pathlib import Path

MAX_FILE_LINES = 1_000
MAX_LINE_LENGTH = 140
SOURCE_SUFFIXES = {".ts", ".tsx", ".css"}
EXEMPT_FILES = {Path("src/api/types.ts"), Path("src/i18n/backendMessages.ts")}
EXEMPT_TREES = {Path("src/i18n/catalogs"), Path("tests/fixtures")}


def exempt(path: Path) -> bool:
    return path in EXEMPT_FILES or any(tree == path or tree in path.parents for tree in EXEMPT_TREES)


def main() -> int:
    issues: list[tuple[Path, int, str]] = []
    for root in (Path("src"), Path("tests")):
        for path in sorted(root.rglob("*")):
            if not path.is_file() or path.suffix not in SOURCE_SUFFIXES or exempt(path):
                continue
            lines = path.read_text(encoding="utf-8").splitlines()
            if len(lines) > MAX_FILE_LINES:
                issues.append((path, 1, f"file has {len(lines)} lines (review target: {MAX_FILE_LINES})"))
            long_lines = [(number, len(line)) for number, line in enumerate(lines, 1) if len(line) > MAX_LINE_LENGTH]
            if long_lines:
                number, width = max(long_lines, key=lambda item: item[1])
                issues.append((path, number, f"{len(long_lines)} long line(s); widest has {width} characters (review target: {MAX_LINE_LENGTH})"))
    for path, line, message in issues:
        print(f"::warning file={path},line={line}::{message}")
    if issues:
        print(f"Readability review: {len(issues)} non-blocking signal(s).")
        return 1
    print("Readability review: no size signals.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
