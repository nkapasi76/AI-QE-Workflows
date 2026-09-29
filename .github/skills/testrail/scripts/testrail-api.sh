#!/usr/bin/env bash
set -euo pipefail

# testrail-api.sh
# Make authenticated requests to TestRail API
#
# Usage: testrail-api.sh <METHOD> <ENDPOINT> [DATA]
#
# Environment Variables:
#   TESTRAIL_URL      - TestRail instance URL (default: https://sessionm.testrail.com)
#   TESTRAIL_USER     - TestRail username (email)
#   TESTRAIL_API_KEY  - TestRail API key
#
# Examples:
#   ./testrail-api.sh GET /api/v2/get_projects
#   ./testrail-api.sh GET /api/v2/get_case/12345
#   ./testrail-api.sh POST /api/v2/add_result/100 '{"status_id":1,"comment":"Passed"}'
#
# Rate Limiting:
#   Automatically retries on 429 responses with exponential backoff.

TESTRAIL_URL="${TESTRAIL_URL:-https://sessionm.testrail.com}"
MAX_RETRIES=3
RETRY_DELAY=5

show_usage() {
    echo "Usage: $0 <METHOD> <ENDPOINT> [DATA]"
    echo ""
    echo "Methods: GET, POST"
    echo ""
    echo "Examples:"
    echo "  $0 GET /api/v2/get_projects"
    echo "  $0 GET /api/v2/get_case/12345"
    echo "  $0 POST /api/v2/add_result/100 '{\"status_id\":1}'"
    exit 1
}

check_env() {
    if [[ -z "${TESTRAIL_USER:-}" ]]; then
        echo "Error: TESTRAIL_USER environment variable not set" >&2
        exit 1
    fi
    if [[ -z "${TESTRAIL_API_KEY:-}" ]]; then
        echo "Error: TESTRAIL_API_KEY environment variable not set" >&2
        exit 1
    fi
}

make_request() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    local attempt=1
    local response
    local http_code

    # Ensure endpoint starts with /
    [[ "$endpoint" != /* ]] && endpoint="/$endpoint"

    # TestRail serves its API under /index.php?/api/v2/...
    [[ "$endpoint" == /api/* ]] && endpoint="/index.php?${endpoint}"

    local url="${TESTRAIL_URL%/}${endpoint}"

    while [[ $attempt -le $MAX_RETRIES ]]; do
        if [[ "$method" == "GET" ]]; then
            response=$(curl -s -w "\n%{http_code}" \
                -u "${TESTRAIL_USER}:${TESTRAIL_API_KEY}" \
                -H "Content-Type: application/json" \
                "$url" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" \
                -u "${TESTRAIL_USER}:${TESTRAIL_API_KEY}" \
                -H "Content-Type: application/json" \
                -X "$method" \
                -d "$data" \
                "$url" 2>&1)
        fi

        http_code=$(echo "$response" | tail -n1)
        response=$(echo "$response" | sed '$d')

        case "$http_code" in
            200)
                echo "$response"
                return 0
                ;;
            429)
                # Rate limited - extract Retry-After or use default
                local retry_after
                retry_after=$(echo "$response" | jq -r '.retry_after // empty' 2>/dev/null || echo "$RETRY_DELAY")
                [[ -z "$retry_after" ]] && retry_after=$RETRY_DELAY
                
                echo "Rate limited. Retrying in ${retry_after}s (attempt $attempt/$MAX_RETRIES)..." >&2
                sleep "$retry_after"
                ((attempt++))
                ;;
            401)
                echo "Error: Unauthorized. Check TESTRAIL_USER and TESTRAIL_API_KEY" >&2
                echo "$response" >&2
                return 1
                ;;
            403)
                echo "Error: Forbidden. No access to this resource" >&2
                echo "$response" >&2
                return 1
                ;;
            404)
                echo "Error: Not found. Check endpoint or IDs" >&2
                echo "$response" >&2
                return 1
                ;;
            *)
                echo "Error: HTTP $http_code" >&2
                echo "$response" >&2
                return 1
                ;;
        esac
    done

    echo "Error: Max retries exceeded" >&2
    return 1
}

# Main
if [[ $# -lt 2 ]]; then
    show_usage
fi

check_env

METHOD=$(echo "$1" | tr '[:lower:]' '[:upper:]')  # Uppercase (bash 3.2 compatible)
ENDPOINT="$2"
DATA="${3:-}"

if [[ "$METHOD" != "GET" && "$METHOD" != "POST" ]]; then
    echo "Error: Unsupported method '$METHOD'. Use GET or POST." >&2
    exit 1
fi

make_request "$METHOD" "$ENDPOINT" "$DATA"
