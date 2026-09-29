#!/bin/bash
#
# Get jobs from child pipelines (recursively handles nested child pipelines)
# Optimized for LLM/agent consumption with minimal token output
#
# Usage:
#   ./get-child-pipeline-jobs.sh <pipeline_id> [options]
#
# Options:
#   --failed         Only show failed jobs
#   --json           Output as JSON (default: compact text)
#   --project PATH   GitLab project path (e.g., core/greyhound)
#   --host HOSTNAME  GitLab hostname (e.g., gitlab.sessionm.com)
#
# Examples:
#   ./get-child-pipeline-jobs.sh 1421206
#   ./get-child-pipeline-jobs.sh 1421206 --failed
#   ./get-child-pipeline-jobs.sh 1421206 --project mygroup/myproject --host gitlab.example.com
#
# Auto-detection:
#   If --project/--host not specified, attempts to detect from git remote origin
#

set -euo pipefail

PROJECT_PATH=""
HOSTNAME=""
FILTER_FAILED=false
OUTPUT_JSON=false

# Auto-detect project and host from git remote
auto_detect_from_git() {
  if ! command -v git &>/dev/null || ! git rev-parse --git-dir &>/dev/null 2>&1; then
    return 1
  fi
  
  local remote_url
  remote_url=$(git remote get-url origin 2>/dev/null || echo "")
  [[ -z "$remote_url" ]] && return 1
  
  # Parse SSH format: git@gitlab.example.com:group/project.git
  if [[ "$remote_url" =~ ^git@([^:]+):(.+)(\.git)?$ ]]; then
    HOSTNAME="${BASH_REMATCH[1]}"
    PROJECT_PATH="${BASH_REMATCH[2]%.git}"
    return 0
  fi
  
  # Parse HTTPS format: https://gitlab.example.com/group/project.git
  if [[ "$remote_url" =~ ^https?://([^/]+)/(.+)(\.git)?$ ]]; then
    HOSTNAME="${BASH_REMATCH[1]}"
    PROJECT_PATH="${BASH_REMATCH[2]%.git}"
    return 0
  fi
  
  return 1
}

show_usage() {
  echo "Usage: $0 <pipeline_id> [--failed] [--json] [--project PATH] [--host HOSTNAME]"
  echo ""
  echo "Options:"
  echo "  --failed         Only show failed jobs"
  echo "  --json           Output as JSON"
  echo "  --project PATH   GitLab project path (e.g., core/greyhound)"
  echo "  --host HOSTNAME  GitLab hostname"
  exit 1
}

if [[ $# -lt 1 ]]; then
  show_usage
fi

PIPELINE_ID="$1"
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --failed) FILTER_FAILED=true; shift ;;
    --json) OUTPUT_JSON=true; shift ;;
    --project) PROJECT_PATH="$2"; shift 2 ;;
    --host) HOSTNAME="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

# Auto-detect if not provided
if [[ -z "$PROJECT_PATH" || -z "$HOSTNAME" ]]; then
  if ! auto_detect_from_git; then
    echo "Error: Could not detect project. Use --project and --host options." >&2
    exit 1
  fi
fi

# URL-encode project path for API
PROJECT_PATH_ENCODED=$(echo "$PROJECT_PATH" | sed 's|/|%2F|g')

# Build hostname flag (only if host differs from glab config default)
HOST_FLAG=""
DEFAULT_HOST=$(glab config get host 2>/dev/null || echo "")
if [[ -n "$HOSTNAME" && "$HOSTNAME" != "$DEFAULT_HOST" ]]; then
  HOST_FLAG="--hostname ${HOSTNAME}"
fi

# Collect all jobs recursively into JSON array
collect_jobs() {
  local pipeline_id="$1"
  local depth="${2:-0}"
  
  # Get jobs for this pipeline
  local jobs
  jobs=$(glab api "projects/${PROJECT_PATH_ENCODED}/pipelines/${pipeline_id}/jobs" $HOST_FLAG 2>/dev/null || echo "[]")
  
  # Filter if needed
  if [[ "$FILTER_FAILED" == "true" ]]; then
    jobs=$(echo "$jobs" | jq '[.[] | select(.status == "failed")]')
  fi
  
  # Add pipeline_id to each job and output
  echo "$jobs" | jq -c --arg pid "$pipeline_id" --argjson depth "$depth" \
    '[.[] | {id:.id, name:.name, status:.status, pipeline_id:($pid|tonumber), depth:$depth}]'
  
  # Get child pipelines and recurse
  local bridges
  bridges=$(glab api "projects/${PROJECT_PATH_ENCODED}/pipelines/${pipeline_id}/bridges" $HOST_FLAG 2>/dev/null || echo "[]")
  
  echo "$bridges" | jq -r '.[] | select(.downstream_pipeline != null) | "\(.downstream_pipeline.id)|\(.downstream_pipeline.status)"' | while IFS='|' read -r child_id child_status; do
    [[ -z "$child_id" ]] && continue
    # Skip successful children when filtering failures
    if [[ "$FILTER_FAILED" == "true" && "$child_status" == "success" ]]; then
      continue
    fi
    collect_jobs "$child_id" $((depth + 1))
  done
}

# Collect all results
ALL_JOBS=$(collect_jobs "$PIPELINE_ID" | jq -s 'add // []')

if [[ "$OUTPUT_JSON" == "true" ]]; then
  # JSON output: compact, machine-readable
  echo "$ALL_JOBS" | jq -c '{project:"'"$PROJECT_PATH"'",pipeline:'$PIPELINE_ID',filter:"'$(if $FILTER_FAILED; then echo "failed"; else echo "all"; fi)'",jobs:.}'
else
  # Compact text output for LLM agents
  TOTAL=$(echo "$ALL_JOBS" | jq 'length')
  FAILED=$(echo "$ALL_JOBS" | jq '[.[] | select(.status == "failed")] | length')
  
  echo "$PROJECT_PATH P$PIPELINE_ID: $TOTAL jobs ($FAILED failed)"
  echo ""
  
  # Group by pipeline_id and show compactly
  echo "$ALL_JOBS" | jq -r 'group_by(.pipeline_id) | .[] | "P\(.[0].pipeline_id): \([.[] | "\(.name)[\(.status[0:1])]#\(.id)"] | join(", "))"'
fi
