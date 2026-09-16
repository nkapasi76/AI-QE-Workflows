#!/usr/bin/env bash
set -euo pipefail

# url-to-testrail.sh
# Convert a TestRail URL into an API endpoint
#
# Usage: url-to-testrail.sh <testrail-url>
#
# Examples:
#   ./url-to-testrail.sh "https://sessionm.testrail.com/index.php?/cases/view/12345"
#   -> GET /api/v2/get_case/12345
#
#   ./url-to-testrail.sh "https://sessionm.testrail.com/index.php?/runs/view/789"
#   -> GET /api/v2/get_run/789
#
#   ./url-to-testrail.sh "https://sessionm.testrail.com/index.php?/suites/view/456"
#   -> GET /api/v2/get_suite/456

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <testrail-url>" >&2
    echo "" >&2
    echo "Examples:" >&2
    echo "  $0 'https://sessionm.testrail.com/index.php?/cases/view/12345'" >&2
    echo "  $0 'https://sessionm.testrail.com/index.php?/runs/view/789'" >&2
    exit 2
fi

url="$1"

# Extract the path after index.php?
# URL format: https://sessionm.testrail.com/index.php?/TYPE/view/ID
# or: https://sessionm.testrail.com/index.php?/projects/overview/ID

path=""
if [[ "$url" =~ index\.php\?(/[^[:space:]]+) ]]; then
    path="${BASH_REMATCH[1]}"
elif [[ "$url" =~ testrail\.com(/[^[:space:]]+) ]]; then
    path="${BASH_REMATCH[1]}"
fi

if [[ -z "$path" ]]; then
    echo "Error: Could not parse URL: $url" >&2
    exit 1
fi

# Parse the path components
# Expected formats:
#   /cases/view/12345
#   /runs/view/789
#   /suites/view/456
#   /projects/overview/3
#   /sections/view/100
#   /tests/view/500

entity=""
id=""

if [[ "$path" =~ /cases/view/([0-9]+) ]]; then
    entity="case"
    id="${BASH_REMATCH[1]}"
elif [[ "$path" =~ /runs/view/([0-9]+) ]]; then
    entity="run"
    id="${BASH_REMATCH[1]}"
elif [[ "$path" =~ /suites/view/([0-9]+) ]]; then
    entity="suite"
    id="${BASH_REMATCH[1]}"
elif [[ "$path" =~ /projects/overview/([0-9]+) ]]; then
    entity="project"
    id="${BASH_REMATCH[1]}"
elif [[ "$path" =~ /sections/view/([0-9]+) ]]; then
    entity="section"
    id="${BASH_REMATCH[1]}"
elif [[ "$path" =~ /tests/view/([0-9]+) ]]; then
    entity="test"
    id="${BASH_REMATCH[1]}"
elif [[ "$path" =~ /milestones/view/([0-9]+) ]]; then
    entity="milestone"
    id="${BASH_REMATCH[1]}"
elif [[ "$path" =~ /plans/view/([0-9]+) ]]; then
    entity="plan"
    id="${BASH_REMATCH[1]}"
else
    echo "Error: Unrecognized TestRail URL pattern: $path" >&2
    echo "Supported patterns:" >&2
    echo "  /cases/view/{id}" >&2
    echo "  /runs/view/{id}" >&2
    echo "  /suites/view/{id}" >&2
    echo "  /projects/overview/{id}" >&2
    echo "  /sections/view/{id}" >&2
    echo "  /tests/view/{id}" >&2
    echo "  /milestones/view/{id}" >&2
    echo "  /plans/view/{id}" >&2
    exit 1
fi

echo "GET /api/v2/get_${entity}/${id}"
