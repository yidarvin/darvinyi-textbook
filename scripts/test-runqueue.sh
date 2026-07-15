#!/usr/bin/env bash
# Public-behavior tests for runqueue.sh. Uses a fake Codex CLI; it never calls a model.

set -euo pipefail

ROOT="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail() { printf 'test-runqueue: %s\n' "$*" >&2; exit 1; }
assert_contains() { case "$1" in *"$2"*) ;; *) fail "expected '$2' in: $1" ;; esac; }

make_fixture() {
  local fixture="$1"
  mkdir -p "$fixture/prompts" "$fixture/bin"
  cp "$ROOT/runqueue.sh" "$fixture/runqueue.sh"
  chmod +x "$fixture/runqueue.sh"
  printf '%s\n' '{"scripts":{"check":"true"}}' > "$fixture/package.json"
  printf '%s\n' '# guide' > "$fixture/AGENTS.md"
  printf '%s\n' 'bin/' 'codex.log' > "$fixture/.gitignore"
  printf '%s\n' '| ID | Title | Status |' '|---|---|---|' '| N17 | Test item | PENDING |' > "$fixture/prompts/queue.md"
  git -C "$fixture" init -q
  git -C "$fixture" config user.email 'test@example.com'
  git -C "$fixture" config user.name 'Runqueue Test'
  git -C "$fixture" add .
  git -C "$fixture" commit -qm 'fixture'
}

write_fake_codex() {
  local fixture="$1"
  cat > "$fixture/bin/codex" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$PWD/codex.log"
case "$*" in
  *'Terra builder'*)
    sed -i.bak 's/| N17 | Test item | PENDING |/| N17 | Test item | DRAFT |/' prompts/queue.md
    rm prompts/queue.md.bak
    printf '%s\n' 'builder output' > builder.txt
    git add prompts/queue.md builder.txt
    git commit -qm 'build: N17 -- Test item'
    ;;
  *'independent Sol critic'*)
    if [ "${RUNQUEUE_TEST_ESCAPE_CRITIC:-0}" = '1' ]; then
      printf '%s\n' 'unauthorised critic edit' > README.md
      git add README.md
      git commit -qm 'bad critic edit'
      exit 0
    fi
    mkdir -p content/critiques
    printf '%s\n' 'verdict: approve' '' '## Critique round 1' '' 'No required findings.' > content/critiques/N17.md
    sed -i.bak 's/| N17 | Test item | DRAFT |/| N17 | Test item | DONE |/' prompts/queue.md
    rm prompts/queue.md.bak
    git add prompts/queue.md content/critiques/N17.md
    git commit -qm 'critique: N17 -- approve'
    ;;
  *)
    exit 0
    ;;
esac
EOF
  chmod +x "$fixture/bin/codex"
}

fixture="$TMP/lifecycle"
make_fixture "$fixture"
write_fake_codex "$fixture"
PATH="$fixture/bin:$PATH" "$fixture/runqueue.sh" -n 1 -y > "$TMP/lifecycle.out"
grep -q '| N17 | Test item | DONE |' "$fixture/prompts/queue.md" || fail 'lifecycle did not finish item'
assert_contains "$(cat "$fixture/codex.log")" 'gpt-5.6-terra'
assert_contains "$(cat "$fixture/codex.log")" 'gpt-5.6-sol'
assert_contains "$(cat "$fixture/codex.log")" 'model_reasoning_effort="high"'

fixture="$TMP/dry-run"
make_fixture "$fixture"
write_fake_codex "$fixture"
output="$(PATH="$fixture/bin:$PATH" "$fixture/runqueue.sh" --dry-run)"
assert_contains "$output" 'gpt-5.6-terra'
assert_contains "$output" 'effort: high'
grep -q '| N17 | Test item | PENDING |' "$fixture/prompts/queue.md" || fail 'dry run changed queue'
[ ! -f "$fixture/codex.log" ] || fail 'dry run invoked Codex'

fixture="$TMP/no-progress"
make_fixture "$fixture"
printf '%s\n' '#!/usr/bin/env bash' 'exit 0' > "$fixture/bin/codex"
chmod +x "$fixture/bin/codex"
if PATH="$fixture/bin:$PATH" "$fixture/runqueue.sh" -n 1 -y > "$TMP/no-progress.out" 2>&1; then
  fail 'runner accepted a no-progress agent'
fi
grep -q 'made no committed progress' "$TMP/no-progress.out" || fail 'no-progress failure was not explicit'

fixture="$TMP/critic-escape"
make_fixture "$fixture"
write_fake_codex "$fixture"
if RUNQUEUE_TEST_ESCAPE_CRITIC=1 PATH="$fixture/bin:$PATH" "$fixture/runqueue.sh" -n 1 -y > "$TMP/critic-escape.out" 2>&1; then
  fail 'runner accepted an out-of-bounds critic edit'
fi
grep -q 'critic changed unauthorised path: README.md' "$TMP/critic-escape.out" || fail 'critic guard was not explicit'

printf '%s\n' 'test-runqueue: passed'
