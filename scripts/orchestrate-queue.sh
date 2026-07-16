#!/usr/bin/env bash
# Persistent wrapper for the Darvinyi queue. It serializes the author/reviewer
# lifecycle, waits for an already-running textbook agent, and pushes only after
# runqueue's transition and npm gate both succeed.

set -uo pipefail

ROOT="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
POLL_SECONDS="${QUEUE_POLL_SECONDS:-15}"
MAX_CRITIQUE_ROUNDS="${QUEUE_MAX_CRITIQUE_ROUNDS:-6}"

cd "$ROOT"

active_textbook_agent() {
  pgrep -f "codex .*exec -C $ROOT" >/dev/null 2>&1
}

while active_textbook_agent; do
  printf '%s waiting for active textbook agent\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')"
  sleep "$POLL_SECONDS"
done

while :; do
  ./runqueue.sh --all --yes --push --max-critique-rounds "$MAX_CRITIQUE_ROUNDS"
  result=$?

  if [ "$result" -ne 0 ]; then
    printf '%s queue stopped with exit %s; inspect the last stage before restarting\n' \
      "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$result" >&2
    exit "$result"
  fi

  if ! rg -q '^\| (Q|N)[0-9]+ .*\| (PENDING|DRAFT) \|$' prompts/queue.md; then
    printf '%s queue drained\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')"
    exit 0
  fi

  # A clean run that leaves actionable work is unexpected, but waiting avoids
  # spinning if an external agent has just begun its stage.
  sleep "$POLL_SECONDS"
done
