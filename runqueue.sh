#!/usr/bin/env bash
# runqueue.sh -- Codex builder/critic loop for the V2 textbook queue.
#
# Each item is durable across interruptions:
#   PENDING --Terra--> DRAFT --Sol approve--> DONE
#                         |         |
#                         |         +--> SKIPPED (approved skip proposal)
#                         +--Sol revise--> Terra resolves --> Sol re-reviews
#
# Terra owns implementation. Sol owns critique verdicts and final queue status.
# Both use high reasoning effort. Every stage commits locally; this script never
# pushes. It stops on a failed agent, dirty tree, failed gate, invalid state
# transition, unauthorised critic edit, or exhausted critique rounds.
#
# Usage:
#   ./runqueue.sh [-a] [-n N] [options]
#
#   -a, --all                 finish every actionable item (default; confirms on TTY)
#   -n, --count N             finish at most N items (counts DONE/SKIPPED transitions)
#       --builder-model MODEL Terra role model (default: gpt-5.6-terra)
#       --critic-model MODEL  Sol role model (default: gpt-5.6-sol)
#       --effort LEVEL        reasoning effort for both roles (default: high)
#   -q, --queue PATH          queue file (default: prompts/queue.md)
#   -t, --timeout SEC         per-agent timeout; 0 disables it (default: 0)
#       --dry-run             print the next action and command without writing
#   -y, --yes                 skip the interactive confirmation for --all
#   -h, --help                show this help

set -uo pipefail

BUILDER_MODEL='gpt-5.6-terra'
CRITIC_MODEL='gpt-5.6-sol'
EFFORT='high'
QUEUE='prompts/queue.md'
MAX=''
TIMEOUT=0
TIMEOUT_BIN=''
DRY_RUN=0
ASSUME_YES=0
MAX_CRITIQUE_ROUNDS=3
CHILD_PID=''

usage() { sed -n '2,/^set -uo pipefail/{/^# \{0,1\}/!d;s/^# \{0,1\}//;p;}' "$0"; }
die() { printf '\033[31m%s\033[0m\n' "runqueue: $*" >&2; exit 2; }
stop() { printf '\033[31m%s\033[0m\n' "runqueue: $*" >&2; exit 1; }

parse_count() {
  local flag="$1" value="$2" count
  case "$value" in ''|*[!0-9]*) die "$flag needs a positive integer, got '$value'";; esac
  [ "${#value}" -le 9 ] || die "$flag value '$value' is out of range"
  count=$((10#$value))
  [ "$count" -ge 1 ] || die "$flag must be at least 1"
  printf '%s' "$count"
}

while [ $# -gt 0 ]; do
  case "$1" in
    -a|--all)             MAX=''; shift ;;
    -n|--count)           [ $# -ge 2 ] || die "$1 needs a value"; MAX="$(parse_count "$1" "$2")"; shift 2 ;;
    --builder-model)      [ $# -ge 2 ] || die "$1 needs a value"; BUILDER_MODEL="$2"; shift 2 ;;
    --critic-model)       [ $# -ge 2 ] || die "$1 needs a value"; CRITIC_MODEL="$2"; shift 2 ;;
    --effort)             [ $# -ge 2 ] || die "$1 needs a value"; EFFORT="$2"; shift 2 ;;
    -q|--queue)           [ $# -ge 2 ] || die "$1 needs a value"; QUEUE="$2"; shift 2 ;;
    -t|--timeout)         [ $# -ge 2 ] || die "$1 needs a value"; TIMEOUT="$(parse_count "$1" "$2")"; shift 2 ;;
    --dry-run)            DRY_RUN=1; shift ;;
    -y|--yes)             ASSUME_YES=1; shift ;;
    -h|--help)            usage; exit 0 ;;
    --)                   shift; break ;;
    -*)                   die "unknown option '$1' (try --help)" ;;
    *)                    die "unexpected argument '$1' (try --help)" ;;
  esac
done
[ $# -eq 0 ] || die "unexpected argument(s): $* (try --help)"

ROOT="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)" || die 'cannot resolve script directory'
cd "$ROOT" || die "cannot cd to $ROOT"

[ -f "$QUEUE" ] || die "queue file not found: $QUEUE"
[ -r "$QUEUE" ] || die "queue file is not readable: $QUEUE"
command -v codex >/dev/null 2>&1 || die "the 'codex' CLI is not on PATH"
command -v npm >/dev/null 2>&1 || die "'npm' is not on PATH (needed for the check gate)"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die 'this workflow requires a git worktree'
if [ "$DRY_RUN" -eq 0 ]; then
  [ -z "$(git status --porcelain)" ] || die 'working tree has uncommitted changes; commit or stash them before starting'
fi

if [ "$TIMEOUT" -gt 0 ]; then
  if command -v timeout >/dev/null 2>&1; then TIMEOUT_BIN='timeout'
  elif command -v gtimeout >/dev/null 2>&1; then TIMEOUT_BIN='gtimeout'
  else die "--timeout needs 'timeout' or 'gtimeout'"; fi
fi

queue_rows() {
  awk -F'|' '
    function trim(value) { gsub(/^[[:space:]]+|[[:space:]]+$/, "", value); return value }
    /^[[:space:]]*\|/ {
      id = trim($2); title = trim($3); status = trim($4)
      if (id ~ /^[A-Z][0-9]+$/) print id "\t" title "\t" status
    }
  ' "$QUEUE"
}

row_for_id() { queue_rows | awk -F'\t' -v wanted="$1" '$1 == wanted { print; exit }'; }
status_for() { row_for_id "$1" | awk -F'\t' '{ print $3 }'; }
verdict_for() {
  local critique="content/critiques/$1.md"
  [ -f "$critique" ] || return 0
  sed -n '1s/^verdict: //p' "$critique"
}
review_rounds() {
  local critique="content/critiques/$1.md" count
  [ -f "$critique" ] || { printf '0'; return; }
  count=$(grep -Ec '^## Critique round [0-9]+' "$critique" 2>/dev/null)
  [ "$?" -le 1 ] || die "cannot read critique file $critique"
  printf '%s' "${count:-0}"
}
count_status() {
  local wanted="$1" count
  count=$(queue_rows | awk -F'\t' -v wanted="$wanted" '$3 == wanted { count++ } END { print count + 0 }')
  printf '%s' "$count"
}
count_complete() { printf '%s' $(( $(count_status DONE) + $(count_status SKIPPED) )); }

# Echoes: action<TAB>id<TAB>title. A pending item is never selected while an
# earlier draft awaits critique or resolution.
find_action() {
  local id title status verdict rounds
  while IFS=$'\t' read -r id title status; do
    [ "$status" = 'DRAFT' ] || continue
    verdict="$(verdict_for "$id")"
    if [ "$verdict" = 'revise' ]; then
      rounds="$(review_rounds "$id")"
      [ "$rounds" -lt "$MAX_CRITIQUE_ROUNDS" ] || stop "$id has exhausted $MAX_CRITIQUE_ROUNDS critique rounds; review it manually"
      printf 'resolve\t%s\t%s\n' "$id" "$title"
      return
    fi
  done < <(queue_rows)

  while IFS=$'\t' read -r id title status; do
    [ "$status" = 'DRAFT' ] || continue
    printf 'critique\t%s\t%s\n' "$id" "$title"
    return
  done < <(queue_rows)

  while IFS=$'\t' read -r id title status; do
    [ "$status" = 'PENDING' ] || continue
    printf 'build\t%s\t%s\n' "$id" "$title"
    return
  done < <(queue_rows)
}

builder_prompt() {
  local id="$1" title="$2"
  cat <<EOF
You are the Terra builder for one item in the Darvinyi interactive textbook queue.

Item: $id — $title

Read AGENTS.md, prompts/queue.md, context/V2_PLAN.md, context/STYLE_GUIDE.md, and context/CURRICULUM.md before acting. Work only on this item. Research time-sensitive or factual claims with primary sources using web search. Preserve the established React/Vite design language and make every educational widget faithfully compute the behavior it teaches.

Implement the complete item, run npm run check, then change only this queue row from PENDING to DRAFT and commit the implementation as: build: $id -- $title. Do not mark it DONE, do not write a critique verdict, do not push, and do not begin another queue item. If the item is genuinely inapplicable, leave it DRAFT and append a concise <!-- skip proposed: reason --> comment to that row for the Sol critic to decide.
EOF
}

resolver_prompt() {
  local id="$1" title="$2"
  cat <<EOF
You are the Terra builder resolving a Sol critique for one Darvinyi interactive textbook queue item.

Item: $id — $title

Read AGENTS.md, the full content/critiques/$id.md history, prompts/queue.md, and every relevant V2/style/curriculum specification. Apply every REQUIRED finding from every critique round without unrelated rewrites. Re-check changed educational claims against primary sources and ensure widgets remain mathematically faithful.

Run npm run check. Append a dated ## Builder resolution section describing the concrete fixes and prior rounds re-verified, change line one of the critique file to verdict: resolved, keep the queue row DRAFT, and commit as: resolve critique: $id. Do not mark it DONE, do not start another item, and do not push.
EOF
}

critic_prompt() {
  local id="$1" title="$2"
  cat <<EOF
You are the independent Sol critic for one Darvinyi interactive textbook queue item.

Item: $id — $title

Read AGENTS.md, prompts/queue.md, the relevant context/V2_PLAN.md appendix and rubric, context/STYLE_GUIDE.md, the current source artifacts, and the complete critique history if it exists. Re-derive the work from the artifacts rather than trusting prior reasoning. Run npm run check and spot-check factual claims against primary sources where appropriate.

You must not edit source code, chapters, styles, tests, or documentation. Your only permitted tracked edits are prompts/queue.md and content/critiques/$id.md. Append a ## Critique round N section with REQUIRED and ADVISORY findings. If any REQUIRED finding remains, set line one to verdict: revise, leave the queue row DRAFT, and commit: critique: $id -- revise. If the item meets the specification, set line one to verdict: approve and change the queue row to DONE, or SKIPPED only for a justified pending skip proposal, then commit: critique: $id -- approve. Do not push.
EOF
}

run_agent() {
  local role="$1" model="$2" prompt="$3" result
  local codex_args=(--search -m "$model" -c "model_reasoning_effort=\"$EFFORT\"" -a never -s workspace-write exec -C "$ROOT")
  printf '\n\033[1m\033[36m%s\033[0m\n' "$role"
  if [ "$TIMEOUT" -gt 0 ]; then
    "$TIMEOUT_BIN" "$TIMEOUT" codex "${codex_args[@]}" "$prompt" </dev/null &
  else
    codex "${codex_args[@]}" "$prompt" </dev/null &
  fi
  CHILD_PID=$!
  wait "$CHILD_PID"
  result=$?
  CHILD_PID=''
  return "$result"
}

ensure_clean() { [ -z "$(git status --porcelain)" ] || stop 'agent left uncommitted changes'; }

validate_critic_paths() {
  local before="$1" after="$2" id="$3" changed path
  changed=$(git diff --name-only "$before" "$after")
  while IFS= read -r path; do
    [ -z "$path" ] && continue
    case "$path" in
      "$QUEUE"|"content/critiques/$id.md") ;;
      *) stop "critic changed unauthorised path: $path" ;;
    esac
  done <<EOF
$changed
EOF
}

validate_transition() {
  local action="$1" id="$2" before="$3" after status verdict
  after="$(git rev-parse HEAD)"
  [ "$before" != "$after" ] || stop "$action for $id made no committed progress"
  ensure_clean
  status="$(status_for "$id")"
  verdict="$(verdict_for "$id")"

  case "$action" in
    build)
      [ "$status" = 'DRAFT' ] || stop "$id must be DRAFT after build, found $status"
      ;;
    resolve)
      [ "$status" = 'DRAFT' ] || stop "$id must remain DRAFT after resolution, found $status"
      [ "$verdict" = 'resolved' ] || stop "$id must have verdict: resolved after resolution, found ${verdict:-<none>}"
      ;;
    critique)
      validate_critic_paths "$before" "$after" "$id"
      case "$verdict" in
        revise) [ "$status" = 'DRAFT' ] || stop "$id must remain DRAFT after revise" ;;
        approve) case "$status" in DONE|SKIPPED) ;; *) stop "$id must be DONE or SKIPPED after approval" ;; esac ;;
        *) stop "$id critic must record approve or revise, found ${verdict:-<none>}" ;;
      esac
      ;;
  esac
}

on_signal() {
  printf '\n\033[33m%s\033[0m\n' 'runqueue: interrupted; stopping.'
  if [ -n "$CHILD_PID" ]; then
    kill -TERM "$CHILD_PID" 2>/dev/null
    wait "$CHILD_PID" 2>/dev/null
  fi
  exit 130
}
trap on_signal INT TERM

pending="$(count_status PENDING)"
drafts="$(count_status DRAFT)"
limit='all actionable items'
[ -n "$MAX" ] && limit="up to $MAX completed item(s)"
printf '\033[1m%s\033[0m\n' 'runqueue plan'
printf '  queue:          %s\n' "$QUEUE"
printf '  target:         %s\n' "$limit"
printf '  builder:        %s (effort: %s)\n' "$BUILDER_MODEL" "$EFFORT"
printf '  critic:         %s (effort: %s)\n' "$CRITIC_MODEL" "$EFFORT"
printf '  sandbox:        workspace-write; approvals never; web search enabled\n'
printf '  delivery:       local commits only; no automatic push\n'
printf '  gate:           npm run check after every agent stage\n'
printf '  queue state:    %s PENDING, %s DRAFT\n' "$pending" "$drafts"

next_action="$(find_action)"
if [ "$DRY_RUN" -eq 1 ]; then
  if [ -n "$next_action" ]; then
    IFS=$'\t' read -r action id title <<EOF
$next_action
EOF
    if [ "$action" = 'critique' ]; then model="$CRITIC_MODEL"; else model="$BUILDER_MODEL"; fi
    printf '  next action:    %s %s — %s\n' "$action" "$id" "$title"
    printf '  command:        codex --search -m %q -c %q -a never -s workspace-write exec -C %q <role prompt>\n' "$model" "model_reasoning_effort=\"$EFFORT\"" "$ROOT"
  else
    printf '  next action:    none\n'
  fi
  printf '\n\033[33m%s\033[0m\n' 'dry run: nothing was executed.'
  exit 0
fi

mkdir -p content/critiques

if [ -z "$next_action" ]; then
  printf '\n%s\n' 'no PENDING or DRAFT items in the queue; nothing to do.'
  exit 0
fi

if [ -z "$MAX" ] && [ "$ASSUME_YES" -eq 0 ] && [ -t 0 ]; then
  printf '\n%s ' 'About to process all actionable items with Codex. Continue? [y/N]'
  read -r reply
  case "$reply" in [Yy]|[Yy][Ee][Ss]) ;; *) printf '%s\n' 'aborted.'; exit 0 ;; esac
fi

completed_start="$(count_complete)"
while :; do
  completed_now="$(count_complete)"
  completed_this_run=$((completed_now - completed_start))
  if [ -n "$MAX" ] && [ "$completed_this_run" -ge "$MAX" ]; then
    printf '\n\033[32m%s\033[0m\n' "reached limit of $MAX completed item(s)."
    break
  fi

  next_action="$(find_action)"
  if [ -z "$next_action" ]; then
    printf '\n\033[32m%s\033[0m\n' "queue drained: completed $completed_this_run item(s)."
    break
  fi

  IFS=$'\t' read -r action id title <<EOF
$next_action
EOF
  before="$(git rev-parse HEAD)"
  case "$action" in
    build)    run_agent "builder: $id — $title" "$BUILDER_MODEL" "$(builder_prompt "$id" "$title")" ;;
    resolve)  run_agent "resolver: $id — $title" "$BUILDER_MODEL" "$(resolver_prompt "$id" "$title")" ;;
    critique) run_agent "critic: $id — $title" "$CRITIC_MODEL" "$(critic_prompt "$id" "$title")" ;;
    *) die "unknown action $action" ;;
  esac
  result=$?
  if [ "$result" -ne 0 ]; then
    if [ "$TIMEOUT" -gt 0 ] && [ "$result" -eq 124 ]; then stop "$action for $id exceeded the ${TIMEOUT}s timeout"; fi
    stop "$action agent exited $result for $id"
  fi

  validate_transition "$action" "$id" "$before"
  if ! npm run check; then stop "npm run check failed after $action for $id"; fi
done
