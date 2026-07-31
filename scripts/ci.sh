#!/bin/sh
# Sequential CI quality gate. Stops at the first failing category (`set -e`) so a
# developer gets a clear "which category broke" signal instead of a wall of mixed
# output from every check running to completion regardless of earlier failures.
set -e

echo "=== 1/4 Standards & Hygiene (typecheck, lint, line-length) ==="
npm run typecheck
npm run lint
python3 scripts/check-max-line-length.py --all --grandfather scripts/ci-linelength-grandfather.txt

echo "=== 2/4 Static Analysis & Isolation (dependency-cruiser) ==="
npm run depcruise --workspaces --if-present

echo "=== 3/4 Domain Logic (engine unit tests, excludes contract suite) ==="
npx vitest run --exclude "**/test/contract/**"

echo "=== 4/4 Contract Parity (RepositoryPort contract suite) ==="
npx vitest run test/contract

echo "=== CI quality gate passed ==="
