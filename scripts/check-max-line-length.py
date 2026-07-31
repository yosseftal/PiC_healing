#!/usr/bin/env python3
"""Fail if any line exceeds MAX_LINE_LENGTH characters (Unicode code points)."""

from __future__ import annotations

import argparse
import fnmatch
import subprocess
import sys
from pathlib import Path

MAX_LINE_LENGTH = 130

REPO_ROOT = Path(__file__).resolve().parent.parent

TEXT_SUFFIXES = {
    ".cjs",
    ".css",
    ".graphql",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mjs",
    ".scss",
    ".sh",
    ".sql",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".vue",
    ".yaml",
    ".yml",
}

SKIP_PATH_PARTS = {".git", ".temp", "node_modules", "dist", "build", "coverage"}

SKIP_FILENAMES = {"package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"}


def should_check(path: Path) -> bool:
    if path.name in SKIP_FILENAMES:
        return False
    if any(part in SKIP_PATH_PARTS for part in path.parts):
        return False
    return path.suffix.lower() in TEXT_SUFFIXES


def lines_over_limit(path: Path) -> list[tuple[int, int]]:
    violations: list[tuple[int, int]] = []
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        print(f"check-max-line-length: cannot read {path}: {exc}", file=sys.stderr)
        return [(0, 0)]

    for line_no, line in enumerate(text.splitlines(), start=1):
        length = len(line)
        if length > MAX_LINE_LENGTH:
            violations.append((line_no, length))
    return violations


def staged_paths() -> list[Path]:
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        print("check-max-line-length: git diff failed (not a git repo?)", file=sys.stderr)
        sys.exit(2)

    paths: list[Path] = []
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        paths.append((REPO_ROOT / line).resolve())
    return paths


def load_grandfather_patterns(path: Path) -> list[str]:
    """Read newline-separated repo-relative paths/glob patterns, skipping blanks and `#` comments."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"check-max-line-length: cannot read grandfather list {path}: {exc}", file=sys.stderr)
        sys.exit(2)

    patterns: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        patterns.append(stripped)
    return patterns


def is_grandfathered(path: Path, patterns: list[str]) -> bool:
    rel = path.relative_to(REPO_ROOT).as_posix()
    return any(rel == pattern or fnmatch.fnmatch(rel, pattern) for pattern in patterns)


def all_paths() -> list[Path]:
    paths: list[Path] = []
    for path in REPO_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if not should_check(path):
            continue
        paths.append(path)
    return sorted(paths)


def check_paths(paths: list[Path]) -> int:
    errors = 0
    for path in paths:
        if not path.is_file() or not should_check(path):
            continue
        for line_no, length in lines_over_limit(path):
            if line_no == 0:
                errors += 1
                continue
            rel = path.relative_to(REPO_ROOT)
            print(
                f"{rel}:{line_no}: line is {length} characters "
                f"(max {MAX_LINE_LENGTH})",
                file=sys.stderr,
            )
            errors += 1
    return errors


def main() -> None:
    parser = argparse.ArgumentParser(
        description=f"Fail when any line exceeds {MAX_LINE_LENGTH} characters.",
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--staged",
        action="store_true",
        help="Check only staged files (default for pre-commit).",
    )
    group.add_argument(
        "--all",
        action="store_true",
        help="Check all tracked text files in the repository.",
    )
    parser.add_argument("paths", nargs="*", help="Explicit files to check.")
    parser.add_argument(
        "--grandfather",
        metavar="<file>",
        default=None,
        help=(
            "Path to a newline-separated file of repo-relative paths/glob patterns to exclude "
            "from whatever set --all/--staged/explicit paths already selected. Additive/opt-in "
            "only: default --staged and --all behavior is unchanged when this is not passed."
        ),
    )
    args = parser.parse_args()

    if args.paths:
        paths = [(REPO_ROOT / p).resolve() for p in args.paths]
    elif args.all:
        paths = all_paths()
    else:
        paths = staged_paths()

    if args.grandfather:
        patterns = load_grandfather_patterns((REPO_ROOT / args.grandfather).resolve())
        paths = [p for p in paths if not is_grandfathered(p, patterns)]

    errors = check_paths(paths)
    if errors:
        print(
            f"\ncheck-max-line-length: {errors} line(s) exceed "
            f"{MAX_LINE_LENGTH} characters.",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
