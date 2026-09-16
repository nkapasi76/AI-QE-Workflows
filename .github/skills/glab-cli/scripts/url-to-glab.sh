#!/usr/bin/env bash
set -euo pipefail

# url-to-glab.sh
# Convert a GitLab URL into a `glab api` command (machine-friendly).
#
# Usage: url-to-glab.sh <gitlab-url> [--with-host]
#
# Options:
#   --with-host    Include --hostname flag (use if default host not configured)
#
# Examples:
#  ./url-to-glab.sh "https://gitlab.sessionm.com/core/greyhound/-/pipelines/1421206"
#  -> glab api projects/core%2Fgreyhound/pipelines/1421206
#
#  ./url-to-glab.sh "https://gitlab.example.com/mygroup/myrepo/-/jobs/123" --with-host
#  -> glab api projects/mygroup%2Fmyrepo/jobs/123 --hostname gitlab.example.com
#
# Note: Assumes `glab config set host <hostname> -g` is configured.
#       Use --with-host for non-default hosts.

if [ $# -lt 1 ]; then
  echo "Usage: $0 <gitlab-url> [--with-host]" >&2
  exit 2
fi

url="$1"
include_host=false
shift
while [ $# -gt 0 ]; do
  case "$1" in
    --with-host) include_host=true; shift ;;
    *) echo "Unknown: $1" >&2; exit 1 ;;
  esac
done

# strip scheme
url_noscheme="${url#*://}"
host="${url_noscheme%%/*}"
path="${url_noscheme#*/}"
if [ "$path" = "$url_noscheme" ]; then
  path=""
fi

# Project is everything before '/-/' when present. Otherwise fall back to the
# first two path components (group/project) as a best-effort.
if [[ "${path}" == *"/-/"* ]]; then
  project="${path%%/-/*}"
  rest="${path#*/-/}"
else
  project="$(echo "${path}" | cut -d'/' -f1-2)"
  rest="${path#${project}}"
  rest="${rest#/}"
fi

# URL-encode slashes in project path for the API path
encoded_project="${project//\//%2F}"

# Build host suffix
host_suffix=""
if [ "$include_host" = true ]; then
  host_suffix=" --hostname ${host}"
fi

cmd=""
case "${rest}" in
  pipelines/*)
    id="${rest#pipelines/}"
    cmd="glab api projects/${encoded_project}/pipelines/${id}${host_suffix}"
    ;;
  pipelines|pipelines)
    cmd="glab api projects/${encoded_project}/pipelines${host_suffix} --paginate | jq -c '.'"
    ;;
  jobs/*)
    # jobs/<id> or jobs/<id>/artifacts or jobs/<id>/trace
    restparts=(${rest//\// })
    id="${restparts[1]}"
    if [[ "${restparts[2]-}" == "artifacts" ]]; then
      cmd="glab api projects/${encoded_project}/jobs/${id}/artifacts${host_suffix} > ${id}-artifacts.zip"
    elif [[ "${restparts[2]-}" == "trace" ]]; then
      cmd="glab api projects/${encoded_project}/jobs/${id}/trace${host_suffix}"
    else
      cmd="glab api projects/${encoded_project}/jobs/${id}${host_suffix}"
    fi
    ;;
  merge_requests/*)
    id="${rest#merge_requests/}"
    cmd="glab api projects/${encoded_project}/merge_requests/${id}${host_suffix}"
    ;;
  "")
    cmd="glab api projects/${encoded_project}${host_suffix}"
    ;;
  *)
    # Generic fallback: return project API command
    cmd="glab api projects/${encoded_project}${host_suffix}"
    ;;
esac

echo "${cmd}"
