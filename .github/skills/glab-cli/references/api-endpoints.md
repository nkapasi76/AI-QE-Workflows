# GitLab API Endpoints Reference

> **Note**: Commands assume default host is configured: `glab config set host gitlab.sessionm.com -g`  
> If not set, add `--hostname gitlab.sessionm.com` to each command.

## Contents

- [Basic API Usage](#basic-api-usage)
- [Project Endpoints](#project-endpoints)
- [Pipeline Endpoints](#pipeline-endpoints)
- [Job Endpoints](#job-endpoints)
- [Merge Request Endpoints](#merge-request-endpoints)
- [Pagination](#pagination)
- [POST/PUT Requests](#postput-requests)
- [GraphQL](#graphql)
- [Placeholders](#placeholders)

---

## Basic API Usage

```bash
# Use :fullpath placeholder (auto-resolves from git remote, URL-encoded)
glab api projects/:fullpath

# Or explicit URL-encoded project path
glab api projects/core%2Fgreyhound

# Include response headers
glab api projects/:fullpath -i
```

## Project Endpoints

```bash
glab api projects/:fullpath
```

## Pipeline Endpoints

```bash
# List pipelines
glab api projects/:fullpath/pipelines

# Get specific pipeline
glab api projects/:fullpath/pipelines/1421206

# List jobs in pipeline
glab api projects/:fullpath/pipelines/1421206/jobs

# List downstream pipelines (bridges)
glab api projects/:fullpath/pipelines/1421206/bridges

# Get jobs from child pipelines (recursive, handles nested children)
# See: .github/skills/glab-cli/scripts/get-child-pipeline-jobs.sh
./scripts/get-child-pipeline-jobs.sh 1421206           # All jobs
./scripts/get-child-pipeline-jobs.sh 1421206 --failed  # Failed jobs only

# Cancel pipeline
glab api projects/:fullpath/pipelines/1421206/cancel -X POST
```

## Job Endpoints

```bash
# Get job details
glab api projects/:fullpath/jobs/11610206

# Get job trace (log)
glab api projects/:fullpath/jobs/11610206/trace

# Retry job
glab api projects/:fullpath/jobs/11610206/retry -X POST
```

## Merge Request Endpoints

```bash
# Get MR details
glab api projects/:fullpath/merge_requests/13354

# Add MR comment
glab api projects/:fullpath/merge_requests/13354/notes -F body="LGTM!"
```

## Pagination

```bash
# Paginate all results
glab api projects/:fullpath/pipelines --paginate

# Filter with jq
glab api projects/:fullpath/pipelines --paginate | jq -c 'select(.status == "failed")'
```

## POST/PUT Requests

```bash
# Trigger new pipeline
glab api projects/:fullpath/pipelines -F ref=main
```

## GraphQL

```bash
# Current user
glab api graphql -f query="query { currentUser { username } }"

# Project info
glab api graphql -f query='
  query {
    project(fullPath: "core/greyhound") {
      name
      description
      webUrl
    }
  }
'
```

## Placeholders

Auto-resolve when in a git repo (automatically URL-encoded):

| Placeholder  | Resolves to       | Example            |
| ------------ | ----------------- | ------------------ |
| `:fullpath`  | Full project path | `core%2Fgreyhound` |
| `:id`        | Project ID        | `12345`            |
| `:repo`      | Repository name   | `greyhound`        |
| `:branch`    | Current branch    | `main`             |
| `:namespace` | Project namespace | `core`             |

> **Tip**: Use `:fullpath` instead of hardcoding `group%2Fproject` - it's portable across repos.
