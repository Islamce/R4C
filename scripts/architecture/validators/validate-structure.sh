#!/usr/bin/env sh
#
# KAAF repository structure validation. Read-only: it never creates, modifies or
# deletes anything.
#
# Two check sets:
#
#   core       every KAAF repository — the framework itself and every adopter.
#              Manifests, generated context, tooling, agent instructions.
#
#   framework  only the repository that *is* KAAF: governance documents,
#              execution prompts, the roadmap, the test suite.
#
# Which set runs is declared, not guessed: `"kaafRole": "framework"` in
# kaaf.repo.json opts in to the framework checks. Anything else is an adopter.
#
# Before this split the script required docs/kaaf/, docs/ai/prompts/ and
# CLAUDE.md unconditionally — files no adopting repository has. Adopting KAAF in
# R4C surfaced it: the validator had to be dropped from the vendored copy, which
# silently removed the structural gate from the first repository to use KAAF.
#
# Usage:  ./scripts/architecture/validators/validate-structure.sh
# Exit:   0 = all required checks passed, 1 = one or more failed.
#
# POSIX sh only, no external dependencies beyond grep and find. See
# docs/kaaf/STANDARDS.md §4 and scripts/architecture/README.md.

set -eu

# Resolve the repository root from this script's location, so the checks give the
# same result regardless of the working directory they are invoked from.
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
cd "$REPO_ROOT"

FAILURES=0
CHECKS=0

pass() { CHECKS=$((CHECKS + 1)); printf '  ok    %s\n' "$1"; }
fail() { CHECKS=$((CHECKS + 1)); FAILURES=$((FAILURES + 1)); printf '  FAIL  %s\n' "$1"; }
info() { printf '  note  %s\n' "$1"; }

section() { printf '\n%s\n' "$1"; }

require_dir() {
  if [ -d "$1" ]; then pass "directory exists: $1"
  else fail "missing required directory: $1"; fi
}

require_file() {
  if [ -f "$1" ]; then pass "file exists: $1"
  else fail "missing required file: $1"; fi
}

# require_reference <file> <needle> <description>
require_reference() {
  if [ ! -f "$1" ]; then
    fail "cannot check reference in missing file: $1"
    return
  fi
  if grep -qF -- "$2" "$1"; then pass "$1 references $3"
  else fail "$1 does not reference $3 (expected to find '$2')"; fi
}

# The role is declared in kaaf.repo.json. Read with grep rather than a JSON
# parser so this script keeps working with nothing but a shell.
ROLE='adopter'
if [ -f 'kaaf.repo.json' ] &&
   grep -q '"kaafRole"[[:space:]]*:[[:space:]]*"framework"' kaaf.repo.json; then
  ROLE='framework'
fi

printf 'KAAF structure validation\n'
printf 'repository root: %s\n' "$REPO_ROOT"
printf 'role:            %s\n' "$ROLE"

# ---------------------------------------------------------------------------
# Core — every KAAF repository
# ---------------------------------------------------------------------------

section 'Required directories'
require_dir '.ai'
require_dir 'scripts/architecture'
require_dir 'scripts/architecture/scanners'
require_dir 'scripts/architecture/generators'
require_dir 'scripts/architecture/validators'
require_dir 'scripts/architecture/utils'
require_dir '.github/workflows'

section 'Manifests — the generator input of record'
require_file 'kaaf.repo.json'
MODULE_MANIFESTS=$(find . -name 'kaaf.module.json' -not -path './.git/*' -not -path './.ai/*' | wc -l | tr -d ' ')
if [ "$MODULE_MANIFESTS" -gt 0 ]; then
  pass "module manifests found: $MODULE_MANIFESTS"
else
  fail 'no kaaf.module.json manifests found — the generator would describe an empty repository'
fi

section 'Generation tooling'
require_file 'scripts/architecture/generate.py'
require_file 'scripts/architecture/generate.sh'
require_file 'scripts/architecture/aggregate.py'
require_file 'scripts/architecture/compat.py'
require_file 'scripts/architecture/scanners/manifests.py'
require_file 'scripts/architecture/scanners/facts.py'
require_file 'scripts/architecture/scanners/source.py'
require_file 'scripts/architecture/scanners/discovery.py'
require_file 'scripts/architecture/scanners/drift.py'
require_file 'scripts/architecture/scanners/consumers.py'
require_file 'scripts/architecture/scanners/languages.py'
require_file 'scripts/architecture/scanners/resolve.py'
require_file 'scripts/architecture/generators/context.py'
require_file 'scripts/architecture/generators/architecture.py'
require_file 'scripts/architecture/generators/modules.py'
require_file 'scripts/architecture/generators/summary.py'
require_file 'scripts/architecture/generators/drift.py'
require_file 'scripts/architecture/generators/diagrams.py'
require_file 'scripts/architecture/generators/index.py'
require_file 'scripts/architecture/validators/validate_generated.py'
require_file 'scripts/architecture/validators/validate_drift.py'
require_file 'scripts/architecture/validators/validate_index.py'
require_file 'scripts/architecture/utils/mermaid.py'
require_file 'scripts/architecture/utils/index_schema.py'

# Discovery is only as good as its language coverage. A repository whose main
# language KAAF cannot read gets confident-looking context with nothing behind
# it, so the supported set is asserted rather than assumed.
if [ -f 'scripts/architecture/scanners/languages.py' ]; then
  MISSING_LANGS=''
  for suffix in '.py' '.ts' '.tsx' '.js' '.jsx' '.dart' '.sh'; do
    grep -qF "\"$suffix\"" scripts/architecture/scanners/languages.py || MISSING_LANGS="$MISSING_LANGS $suffix"
  done
  if [ -z "$MISSING_LANGS" ]; then
    pass 'discovery covers python, typescript, javascript, dart and shell'
  else
    fail "discovery is missing language support for:$MISSING_LANGS"
  fi
fi

section 'Generated context'
require_file '.ai/ai-context.json'
require_file '.ai/architecture.json'
require_file '.ai/summary.md'
require_file '.ai/drift.json'
require_file '.ai/index/repository.json'
require_dir '.ai/modules'
require_dir '.ai/diagrams'
require_file '.ai/diagrams/index.md'
require_file '.ai/diagrams/context.md'

if [ -f '.ai/summary.md' ]; then
  require_reference '.ai/summary.md' 'KAAF-GENERATED' 'the generated-content marker'
fi

# Every diagram must be reviewable as text and marked as generated. A binary
# image or an unmarked file means a second source of truth has crept in
# (docs/kaaf/STANDARDS.md §5).
if [ -d '.ai/diagrams' ]; then
  UNMARKED=0
  NON_MARKDOWN=0
  for diagram in .ai/diagrams/*; do
    [ -e "$diagram" ] || continue
    case "$diagram" in
      *.md) grep -qF 'KAAF-GENERATED' "$diagram" || UNMARKED=$((UNMARKED + 1)) ;;
      *) NON_MARKDOWN=$((NON_MARKDOWN + 1)) ;;
    esac
  done
  if [ "$UNMARKED" -eq 0 ]; then
    pass 'every diagram carries the generated-content marker'
  else
    fail "$UNMARKED diagram(s) missing the KAAF-GENERATED marker"
  fi
  if [ "$NON_MARKDOWN" -eq 0 ]; then
    pass 'diagrams are text-based (no binary images)'
  else
    fail "$NON_MARKDOWN non-Markdown file(s) in .ai/diagrams — diagrams must be text"
  fi
fi

section 'Agent instructions'
require_file 'AGENTS.md'
require_reference 'AGENTS.md' '.ai/' 'the generated context'
require_reference 'README.md' '.ai/' 'the generated context'

# ---------------------------------------------------------------------------
# Framework — only the repository that is KAAF itself
# ---------------------------------------------------------------------------

if [ "$ROLE" = 'framework' ]; then
  section 'KAAF governance documents (framework only)'
  require_file 'docs/kaaf/README.md'
  require_file 'docs/kaaf/GOVERNANCE.md'
  require_file 'docs/kaaf/STANDARDS.md'
  require_file 'docs/kaaf/ROADMAP.md'
  require_file 'docs/kaaf/CHANGELOG.md'
  require_file 'docs/kaaf/INDEX.md'

  section 'Execution prompts (framework only)'
  require_file 'docs/ai/prompts/README.md'
  require_file 'docs/ai/prompts/KAAF-WMS-EXECUTION.md'
  require_file 'docs/ai/prompts/KAAF-ANALYTICS-EXECUTION.md'
  require_file 'docs/ai/prompts/KAAF-R4C-EXECUTION.md'
  require_file 'docs/ai/prompts/KAAF-KYNOX-PORTAL-EXECUTION.md'

  section 'Framework tooling and documentation'
  require_file 'scripts/architecture/run-tests.sh'
  require_dir 'scripts/architecture/tests'
  require_file 'scripts/architecture/README.md'
  require_file 'CLAUDE.md'
  require_file '.ai/README.md'
  require_file '.ai/.gitkeep'

  section 'Cross-references (framework only)'
  require_reference 'README.md' '## AI Architecture (KAAF)' 'the KAAF section heading'
  require_reference 'README.md' 'docs/kaaf/' 'docs/kaaf/'
  require_reference 'README.md' 'docs/ai/prompts/' 'docs/ai/prompts/'
  require_reference 'CLAUDE.md' 'docs/kaaf/' 'the KAAF documentation'
  require_reference 'AGENTS.md' 'docs/kaaf/' 'the KAAF documentation'

  # New scope needs a roadmap entry before it lands, not after.
  section 'Roadmap (framework only)'
  if grep -q 'Phase 7 — Language Coverage' docs/kaaf/ROADMAP.md; then
    pass 'roadmap covers every implemented phase'
  else
    fail 'docs/kaaf/ROADMAP.md does not describe Phase 7'
  fi
else
  section 'Framework checks'
  info 'skipped — this repository adopts KAAF rather than being KAAF.'
  info 'Governance lives in Islamce/KAAF; this repository is not expected to carry it.'
fi

section 'Result'
printf '  %s checks, %s failure(s)\n\n' "$CHECKS" "$FAILURES"

if [ "$FAILURES" -ne 0 ]; then
  printf 'KAAF structure validation FAILED.\n'
  if [ "$ROLE" = 'framework' ]; then
    printf 'See docs/kaaf/GOVERNANCE.md and docs/kaaf/ROADMAP.md for the required layout.\n'
  else
    printf 'See https://github.com/Islamce/KAAF — docs/kaaf/INDEX.md section 8, adoption.\n'
  fi
  exit 1
fi

printf 'KAAF structure validation passed.\n'
exit 0
