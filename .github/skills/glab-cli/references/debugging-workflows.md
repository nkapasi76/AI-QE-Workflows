# Debugging Workflows

> **Note**: Commands assume default host is configured: `glab config set host gitlab.sessionm.com -g`

## Contents

- [Debug Failed Pipeline from URL](#debug-failed-pipeline-from-url)
- [Debug Failed Job from URL](#debug-failed-job-from-url)
- [Monitor Running Pipeline](#monitor-running-pipeline)

---

## Debug Failed Pipeline from URL

Given: `https://gitlab.sessionm.com/core/greyhound/-/pipelines/1421206`

```bash
# 1. Get pipeline info (run from repo directory, :fullpath auto-resolves)
glab api projects/:fullpath/pipelines/1421206

# 2. List all jobs in the pipeline
glab api projects/:fullpath/pipelines/1421206/jobs

# 2b. Or get all jobs including child pipelines (recursive)
scripts/get-child-pipeline-jobs.sh 1421206 --failed

# 3. Trace a failed job (use job ID from step 2)
glab ci trace <job-id> -R core/greyhound

# 4. Or get raw log via API
glab api projects/:fullpath/jobs/<job-id>/trace

# 5. Download artifacts (via API - more reliable)
glab api projects/:fullpath/jobs/<job-id>/artifacts > artifacts.zip && unzip -l artifacts.zip

# 5b. Or using glab job artifact (requires exact ref name)
glab job artifact <ref> <job-name> -R core/greyhound --path=./debug/
```

## Debug Failed Job from URL

Given: `https://gitlab.sessionm.com/core/greyhound/-/jobs/11610206`

```bash
# 1. Get job details
glab api projects/:fullpath/jobs/11610206

# 2. Get job log/trace
glab ci trace 11610206 -R core/greyhound

# 3. Or via API (raw log)
glab api projects/:fullpath/jobs/11610206/trace
```

## Monitor Running Pipeline

```bash
# Live status updates
glab ci status --live -R core/greyhound

# Poll via API
glab api projects/:fullpath/pipelines | jq '.[0]'
```
