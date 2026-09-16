---
name: glab-cli
description: |
  GitLab CLI (glab) for gitlab.sessionm.com. Use when:
  - User mentions gitlab.sessionm.com URLs (merge requests, pipelines, jobs)
  - URLs like https://gitlab.sessionm.com/core/greyhound/-/merge_requests/13354
  - URLs like https://gitlab.sessionm.com/core/greyhound/-/pipelines/1421206
  - URLs like https://gitlab.sessionm.com/core/greyhound/-/jobs/11610206
  - Downloading CI/CD job logs, checking pipeline status, reviewing merge requests
  NOT for: github.com, gitlab.com (public), or other GitLab instances.
---

# GitLab CLI (glab) for gitlab.sessionm.com

## URL Parsing

Convert gitlab.sessionm.com URLs to glab commands using `scripts/url-to-glab.sh`:

```bash
scripts/url-to-glab.sh "https://gitlab.sessionm.com/core/greyhound/-/pipelines/1421206"
# Output: glab api projects/core%2Fgreyhound/pipelines/1421206
```

### URL Structure

```
https://gitlab.sessionm.com/core/greyhound/-/merge_requests/13354
                          └─────┬──────┘   └──────┬───────┘ └──┬─┘
                             REPO             TYPE          ID
```

| URL Pattern                | Command                                         |
| -------------------------- | ----------------------------------------------- |
| `.../merge_requests/13354` | `glab mr view 13354 -R core/greyhound`          |
| `.../pipelines/1421206`    | `glab api projects/:fullpath/pipelines/1421206` |
| `.../jobs/11610206`        | `glab ci trace 11610206 -R core/greyhound`      |

---

## Prerequisites

1. **Install glab CLI**:

   ```bash
   brew install glab
   ```

2. **Set default host** (eliminates need for `--hostname` flag):

   ```bash
   glab config set host gitlab.sessionm.com -g
   ```

3. **Authenticate with gitlab.sessionm.com**:

   ```bash
   glab auth login --hostname gitlab.sessionm.com
   ```

4. **Verify setup**:
   ```bash
   glab api graphql -f query="query { currentUser { username } }"
   ```

---

## Quick Reference

| Task                  | Command                                                       |
| --------------------- | ------------------------------------------------------------- |
| Pipeline status       | `glab ci status`                                              |
| List pipelines        | `glab ci list`                                                |
| Get pipeline (JSON)   | `glab api projects/:fullpath/pipelines/<id>`                  |
| List jobs in pipeline | `glab api projects/:fullpath/pipelines/<id>/jobs`             |
| Child pipeline jobs   | `scripts/get-child-pipeline-jobs.sh <pipeline-id> [--failed]` |
| Job trace             | `glab ci trace <job-id>`                                      |
| Job trace (API)       | `glab api projects/:fullpath/jobs/<id>/trace`                 |
| MR details            | `glab mr view <id>`                                           |
| MR diff               | `glab mr diff <id>`                                           |
| Download artifacts    | `glab job artifact <ref> <job-name> --path=<path>`            |

> **Note**: `:fullpath` auto-resolves from git remote (URL-encoded). Use explicit `group%2Fproject` for other repos.

---

## Host Configuration

```bash
# Set default host globally (recommended - run once)
glab config set host gitlab.sessionm.com -g

# Or per-command (if needed for different hosts)
glab api ... --hostname gitlab.sessionm.com
```

> **Note**: After setting the default host, you can omit `--hostname` from all `glab api` commands.

---

## CI/CD Operations

### Pipeline Status

```bash
glab ci status
glab ci status --live
glab ci status --branch=main
```

### List Pipelines

```bash
glab ci list
glab ci list --status=failed
glab ci list --ref=main
glab ci list --output json
```

### Job Trace

```bash
glab ci trace <job-id>
glab ci trace <job-id> -R core/greyhound
glab ci trace --pipeline-id=1421206 build
```

### Download Artifacts

```bash
glab job artifact main build
glab job artifact main build --path="./artifacts/"
```

---

## Merge Requests

### List MRs

```bash
glab mr list --assignee=@me
glab mr list --reviewer=@me
glab mr list --state=merged
```

### View & Review

```bash
glab mr view 123
glab mr view 123 --comments
glab mr diff 123
glab mr checkout 123
```

### Approve & Comment

```bash
glab mr approve 123
glab mr note 123 -m "LGTM!"
glab mr revoke 123
```

---

## Working with Other Repos

```bash
glab ci status -R core/greyhound
glab mr list -R core/subgroup/project
```

---

## Advanced Topics

- **API endpoints**: See [references/api-endpoints.md](references/api-endpoints.md) for REST/GraphQL examples
- **Debugging workflows**: See [references/debugging-workflows.md](references/debugging-workflows.md) for step-by-step guides

---

## Troubleshooting

| Issue                            | Cause                     | Solution                                                     |
| -------------------------------- | ------------------------- | ------------------------------------------------------------ |
| `401 Unauthorized`               | Invalid or expired token  | Run `glab auth login --hostname gitlab.sessionm.com`         |
| `404 Not Found`                  | Wrong project path or ID  | Verify URL; ensure path is URL-encoded (`/` → `%2F`)         |
| Commands target wrong host       | Default host not set      | `glab config set host gitlab.sessionm.com -g`                |
| `glab api` fails with wrong host | Config not set globally   | Add `-g` flag: `glab config set host gitlab.sessionm.com -g` |
| Permission denied                | Insufficient token scopes | Generate token with `api`, `read_repository` scopes          |
