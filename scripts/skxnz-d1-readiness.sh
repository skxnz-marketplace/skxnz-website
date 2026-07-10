#!/usr/bin/env bash
set -uo pipefail

include_build=0
failure_count=0
if [[ "${1:-}" == "--include-build" || "${1:-}" == "-IncludeBuild" ]]; then
  include_build=1
fi

step() { printf '\n== %s ==\n' "$1"; }

run_logged() {
  local label="$1"
  shift
  step "$label"
  "$@"
  local code=$?
  if [[ "$code" -ne 0 ]]; then
    failure_count=$((failure_count + 1))
    printf 'Command failed with exit code %s. Continuing so the full report is still visible.\n' "$code"
  fi
}

has_script() {
  local name="$1"
  node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$name'] ? 0 : 1)" >/dev/null 2>&1
}

runner() {
  if [[ -f pnpm-lock.yaml ]]; then printf 'pnpm'; elif [[ -f yarn.lock ]]; then printf 'yarn'; elif [[ -f package-lock.json ]]; then printf 'npm'; else printf 'npm'; fi
}

run_script() {
  local name="$1"
  local pm
  pm="$(runner)"
  if [[ "$pm" == "npm" ]]; then npm run "$name"; else "$pm" run "$name"; fi
}

tracked_scan_files() {
  git ls-files |
    grep -Ev '(^|/)(node_modules|\.next|\.git|coverage|dist|build|out|generated)(/|$)' |
    grep -E '\.(ts|tsx|js|jsx|mjs|cjs|json|md|sql|css|scss|html)$' |
    grep -Ev '\.(lock)$' |
    grep -Ev '(^|/)\.env' || true
}

printf 'SKXNZ Day 1 readiness check\n'
printf 'This script reports findings only. It does not edit, stage, commit, push, deploy, install, reset, clean, or apply SQL.\n'

run_logged "Git branch" git branch --show-current
run_logged "Git HEAD" git rev-parse HEAD
run_logged "Git status" git status --short

pm="$(runner)"
step "Package manager"
printf '%s\n' "$pm"

if [[ -f package.json ]] && has_script "typecheck"; then
  run_logged "TypeScript" run_script "typecheck"
elif [[ -f tsconfig.json ]]; then
  if command -v tsc >/dev/null 2>&1; then run_logged "TypeScript" tsc --noEmit --incremental false; else step "TypeScript"; printf 'tsconfig.json exists, but no typecheck script or tsc executable is available.\n'; failure_count=$((failure_count + 1)); fi
else
  step "TypeScript"; printf 'No tsconfig.json found; skipped.\n'
fi

if [[ -f package.json ]] && has_script "lint"; then run_logged "Lint" run_script "lint"; else step "Lint"; printf 'No lint script found; skipped.\n'; fi

if [[ -f package.json ]]; then
  mapfile -t test_scripts < <(node -e "const p=require('./package.json'); for (const k of Object.keys(p.scripts || {})) if (k === 'test' || k.startsWith('test:')) console.log(k)")
else
  test_scripts=()
fi

if [[ "${#test_scripts[@]}" -gt 0 ]]; then
  for script_name in "${test_scripts[@]}"; do run_logged "Test script: $script_name" run_script "$script_name"; done
else
  step "Tests"; printf 'No test script found; skipped.\n'
fi

if [[ "$include_build" -eq 1 ]]; then
  if [[ -f package.json ]] && has_script "build"; then run_logged "Build" run_script "build"; else step "Build"; printf 'No build script found; skipped.\n'; fi
else
  step "Build"; printf 'Skipped. Re-run with --include-build to include build.\n'
fi

mapfile -t scan_files < <(tracked_scan_files)

step "Secret pattern scan"
secret_pattern='(sk_live_[A-Za-z0-9_]+|rzp_live_[A-Za-z0-9_]+|service_role["'\'':= ][A-Za-z0-9._-]{20,}|SUPABASE_SERVICE_ROLE_KEY["'\'':= ][A-Za-z0-9._-]{20,})'
if [[ "${#scan_files[@]}" -eq 0 ]]; then
  printf 'No tracked source files found for scanning.\n'
elif grep -InE "$secret_pattern" "${scan_files[@]}" 2>/dev/null; then
  printf 'Review potential secret references above. This is a pattern finding, not automatic proof of exposure.\n'
else
  printf 'No likely real secret patterns found in tracked scan files.\n'
fi

step "Internal wording scan"
mapfile -t keyword_files < <(printf '%s\n' "${scan_files[@]}" | grep -E '^(app|components|lib)/' || true)
if [[ "${#keyword_files[@]}" -eq 0 ]]; then
  printf 'No app/components/lib tracked files found for keyword scanning.\n'
elif grep -InEi '\b(demo|mock|placeholder|MVP)\b' "${keyword_files[@]}" 2>/dev/null; then
  printf 'Review keyword findings above. They may be legitimate internal code or stale public copy.\n'
else
  printf 'No internal wording keywords found in app/components/lib tracked files.\n'
fi

step "Summary"
if [[ "$failure_count" -gt 0 ]]; then
  printf '%s command check(s) failed. Keyword findings did not affect this exit code.\n' "$failure_count"
  exit 1
fi
printf 'Completed successfully. Keyword findings do not change the exit code.\n'
