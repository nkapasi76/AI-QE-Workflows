---
name: atlassian-cli
description: |
  Atlassian CLI (acli) and REST API for sessionm.atlassian.net. Use when:
  - User mentions sessionm.atlassian.net or JIRA tickets
  - Reading JIRA work items, projects, boards, sprints
  - Searching and filtering JIRA issues
  - Viewing issue details, comments, attachments
  - Listing project information
  - Reading Confluence pages, attachments, children, comments
  - Accessing Confluence content linked from JIRA tickets
  - READ-ONLY operations only - no editing, creating, or deleting
  NOT for: github.com, gitlab.com, or other JIRA/Confluence instances.
---

# Atlassian CLI (acli) and REST API for sessionm.atlassian.net

## Project Restriction

**All queries and direct ticket access are filtered to only MLP and TCOE projects.**

- If a request attempts to search or access any other project or Jira ticket (not MLP-xxx or TCOE-xxx), the skill will inform the user: _"This skill is limited to Merchant Loyalty Program (MLP) and Testing Center of Excellence (TCOE) projects only. Other projects are not supported."_
- This applies to all search operations and direct ticket access.

## Overview

The Atlassian CLI (`acli`) provides command-line access to JIRA for reading tickets, searching issues, and viewing project information. **All operations are strictly limited to the Merchant Loyalty Program (MLP) and Testing Center of Excellence (TCOE) projects.** The Confluence REST API v2 complements this by providing read access to Confluence pages, attachments, children pages, and comments, but only if related to MLP or TCOE. This skill set focuses on **read-only operations** to help you quickly access JIRA and Confluence data without leaving the terminal.

## Prerequisites

### 1. Install acli CLI

**macOS (Homebrew):**

```bash
brew tap atlassian/homebrew-acli
brew install acli
```

**Verify installation:**

```bash
acli --version
```

### 2. Set Up Authentication

The `ATLASSIAN_API_TOKEN` and `ATLASSIAN_USER` are available in your `.env.user.config` file. Use them to authenticate:

```bash
# Bash/zsh (macOS/Linux): load credentials from .env.user.config
set -a
source .env.user.config
set +a

# Authenticate with API token
echo $ATLASSIAN_API_TOKEN | acli jira auth login \
  --site "sessionm.atlassian.net" \
  --email "$ATLASSIAN_USER" \
  --token
```

```powershell
# PowerShell (Windows/macOS/Linux): load credentials from .env.user.config
./.github/skills/atlassian-cli/scripts/load-atlassian-env.ps1

# Authenticate with API token
$env:ATLASSIAN_API_TOKEN | acli jira auth login --site "sessionm.atlassian.net" --email "$env:ATLASSIAN_USER" --token
```

You can also run `./.github/skills/atlassian-cli/scripts/load-atlassian-env.ps1 -Quiet` to suppress output in automation flows.

Or authenticate using OAuth (opens browser):

```bash
acli jira auth login --web
```

### 3. Verify Authentication

```bash
acli jira auth status
```

---

## Quick Reference

### JIRA CLI Commands

| Task                   | Command                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| View work item         | `acli jira workitem view KEY-123`                                                        |
| Search work items      | `acli jira workitem search --jql "project = TEAM"`                                       |
| View custom fields     | `acli jira workitem view KEY-123 --fields "summary,customfield_11800,customfield_13217"` |
| Search by custom field | `acli jira workitem search --jql "customfield_11800 = 'QA Team'"`                        |
| List projects          | `acli jira project list`                                                                 |
| View project           | `acli jira project view --key "TEAM"`                                                    |
| List filters           | `acli jira filter list`                                                                  |
| Search with filter     | `acli jira workitem search --filter 10001`                                               |
| Get JSON output        | `acli jira workitem view KEY-123 --json`                                                 |

### Confluence REST API (curl)

| Task                 | Endpoint                                      |
| -------------------- | --------------------------------------------- |
| Get page by ID       | `GET /wiki/api/v2/pages/{id}`                 |
| Get pages in space   | `GET /wiki/api/v2/spaces/{id}/pages`          |
| Get page attachments | `GET /wiki/api/v2/pages/{id}/attachments`     |
| Get attachment by ID | `GET /wiki/api/v2/attachments/{id}`           |
| Get child pages      | `GET /wiki/api/v2/pages/{id}/direct-children` |
| Get footer comments  | `GET /wiki/api/v2/pages/{id}/footer-comments` |
| Get inline comments  | `GET /wiki/api/v2/pages/{id}/inline-comments` |

---

## Custom Fields Reference

The following custom fields are commonly used in MLP and TCOE projects. Use these field IDs when searching or displaying custom field data.

### Custom Field Mappings

| Field Name          | Custom Field ID     | Description                    |
| ------------------- | ------------------- | ------------------------------ |
| Team                | `customfield_11800` | Team assignment                |
| Squad Assignment    | `customfield_13217` | Squad/sub-team assignment      |
| Epic Link           | `customfield_10706` | Link to parent epic            |
| Select Client(s)    | `customfield_13084` | Associated client(s)           |
| Bug Description     | `customfield_14727` | Detailed bug description       |
| Tribe               | `customfield_13078` | Tribe assignment               |
| Feature Description | `customfield_14166` | Detailed feature description   |
| Severity Levels     | `customfield_13067` | Bug severity level             |
| Technical Category  | `customfield_13176` | Technical categorization       |
| Story Description   | `customfield_14697` | Detailed story description     |
| Environment Type    | `customfield_13235` | Environment where issue occurs |

### Using Custom Fields in JQL

```bash
# Search by team
acli jira workitem search --jql "project = MLP AND customfield_11800 = 'QA Team'"

# Search by squad assignment
acli jira workitem search --jql "project = MLP AND customfield_13217 = 'Squad Alpha'"

# Search by epic link
acli jira workitem search --jql "project = MLP AND 'Epic Link' = MLP-1234"

# Search by severity level
acli jira workitem search --jql "project = MLP AND customfield_13067 = 'Critical'"

# Search by technical category
acli jira workitem search --jql "project = MLP AND customfield_13176 = 'API'"

# Search by environment type
acli jira workitem search --jql "project = MLP AND customfield_13235 = 'QA'"

# Complex query with multiple custom fields
acli jira workitem search --jql "project = MLP AND customfield_11800 = 'QA Team' AND customfield_13067 = 'High' AND status = 'Open'"
```

### Displaying Custom Fields in Output

```bash
# View specific custom fields
acli jira workitem view MLP-1234 --fields "summary,status,customfield_11800,customfield_13217"

# View issue with team and squad
acli jira workitem view MLP-1234 --fields "summary,status,customfield_11800,customfield_13217,customfield_13078"

# Search and display custom fields in results
acli jira workitem search \
  --jql "project = MLP AND status = 'In Progress'" \
  --fields "key,summary,status,customfield_11800,customfield_13217,customfield_13067"

# Export to CSV with custom fields
acli jira workitem search \
  --jql "project = MLP AND type = Bug" \
  --fields "key,summary,customfield_14727,customfield_13067,customfield_13235" \
  --csv > bugs_with_details.csv

# Get JSON with all custom fields for parsing
acli jira workitem view MLP-1234 --json | \
  jq '{key, summary: .fields.summary, team: .fields.customfield_11800, squad: .fields.customfield_13217, severity: .fields.customfield_13067}'
```

### Custom Field Examples by Use Case

#### QA Team Workflow

```bash
# Find all QA team bugs in progress
acli jira workitem search \
  --jql "project = MLP AND customfield_11800 = 'QA' AND type = Bug AND status = 'In Progress'" \
  --fields "key,summary,customfield_14727,customfield_13067,customfield_13235"

# Find critical bugs in QA environment
acli jira workitem search \
  --jql "project = MLP AND customfield_13067 = 'Critical' AND customfield_13235 = 'QA'" \
  --fields "key,summary,status,customfield_14727"
```

#### Feature Development Tracking

```bash
# Find all features for a specific squad
acli jira workitem search \
  --jql "project = MLP AND type = Story AND customfield_13217 = 'Squad Alpha'" \
  --fields "key,summary,customfield_14697,customfield_14166,status"

# Track features by tribe and technical category
acli jira workitem search \
  --jql "project = MLP AND customfield_13078 = 'Platform Tribe' AND customfield_13176 = 'API'" \
  --fields "key,summary,customfield_14166,status"
```

#### Client-Specific Issues

```bash
# Find all issues for a specific client
acli jira workitem search \
  --jql "project = MLP AND customfield_13084 ~ 'ClientName'" \
  --fields "key,summary,status,customfield_13084"
```

#### Epic and Story Tracking

```bash
# Find all stories under an epic
acli jira workitem search \
  --jql "project = MLP AND 'Epic Link' = MLP-5000" \
  --fields "key,summary,status,customfield_14697,customfield_10706"

# View epic with its custom fields
acli jira workitem view MLP-5000 \
  --fields "summary,status,customfield_11800,customfield_13217,customfield_13078"
```

### Helper Script for Custom Fields

Create a script to easily query custom fields:

```bash
#!/bin/bash
# Save as: jira-custom-fields.sh

set -a
source .env.user.config
set +a

case "$1" in
  by-team)
    # Usage: ./jira-custom-fields.sh by-team "QA Team"
    acli jira workitem search \
      --jql "project = MLP AND customfield_11800 = '$2'" \
      --fields "key,summary,status,customfield_11800,customfield_13217"
    ;;
  by-squad)
    # Usage: ./jira-custom-fields.sh by-squad "Squad Alpha"
    acli jira workitem search \
      --jql "project = MLP AND customfield_13217 = '$2'" \
      --fields "key,summary,status,customfield_13217"
    ;;
  by-severity)
    # Usage: ./jira-custom-fields.sh by-severity "Critical"
    acli jira workitem search \
      --jql "project = MLP AND type = Bug AND customfield_13067 = '$2'" \
      --fields "key,summary,status,customfield_13067,customfield_14727,customfield_13235"
    ;;
  by-tribe)
    # Usage: ./jira-custom-fields.sh by-tribe "Platform Tribe"
    acli jira workitem search \
      --jql "project = MLP AND customfield_13078 = '$2'" \
      --fields "key,summary,status,customfield_13078,customfield_13176"
    ;;
  view-custom)
    # Usage: ./jira-custom-fields.sh view-custom MLP-1234
    acli jira workitem view "$2" --json | \
      jq '{key, summary: .fields.summary, team: .fields.customfield_11800, squad: .fields.customfield_13217, tribe: .fields.customfield_13078, severity: .fields.customfield_13067, technical_category: .fields.customfield_13176, environment: .fields.customfield_13235}'
    ;;
  *)
    echo "Usage: $0 {by-team|by-squad|by-severity|by-tribe|view-custom} [VALUE]"
    echo ""
    echo "Commands:"
    echo "  by-team TEAM_NAME       - Find issues by team"
    echo "  by-squad SQUAD_NAME     - Find issues by squad"
    echo "  by-severity SEVERITY    - Find bugs by severity"
    echo "  by-tribe TRIBE_NAME     - Find issues by tribe"
    echo "  view-custom ISSUE_KEY   - View issue with all custom fields"
    ;;
esac
```

Make it executable:

```bash
chmod +x jira-custom-fields.sh
./jira-custom-fields.sh by-team "QA Team"
./jira-custom-fields.sh by-severity "Critical"
./jira-custom-fields.sh view-custom MLP-1234
```

---

## Work Item (Issue) Operations

### View Work Item Details

```bash
# View basic work item information
acli jira workitem view KEY-123

# View specific fields only
acli jira workitem view KEY-123 --fields summary,status,assignee

# View all fields
acli jira workitem view KEY-123 --fields '*all'

# Get JSON output
acli jira workitem view KEY-123 --json

# Open in web browser
acli jira workitem view KEY-123 --web
```

### Search Work Items

```bash
# Search with JQL query
acli jira workitem search --jql "project = TEAM"

# Search with pagination (get all results)
acli jira workitem search --jql "project = TEAM AND status = 'In Progress'" --paginate

# Limit results
acli jira workitem search --jql "assignee = currentUser()" --limit 20

# Get count only
acli jira workitem search --jql "project = TEAM" --count

# Custom fields in output
acli jira workitem search --jql "project = TEAM" --fields "key,summary,assignee,status"

# Export to CSV
acli jira workitem search --jql "project = TEAM" --csv

# Export to JSON
acli jira workitem search --jql "project = TEAM" --json

# Search using saved filter
acli jira workitem search --filter 10001

# Open search results in browser
acli jira workitem search --jql "project = TEAM" --web
```

### Common JQL Examples

```bash
# View your assigned issues
acli jira workitem search --jql "assignee = currentUser() AND status != Done"

# View issues by status
acli jira workitem search --jql "project = TEAM AND status = 'In Progress'"

# View recent updates
acli jira workitem search --jql "project = TEAM AND updated >= -7d"

# View by priority
acli jira workitem search --jql "project = TEAM AND priority = High"

# Complex queries
acli jira workitem search --jql "project = TEAM AND type = Bug AND status = Open AND assignee = currentUser()"

# Search with custom fields (see Custom Fields Reference section)
acli jira workitem search --jql "project = MLP AND customfield_11800 = 'QA Team' AND status = 'In Progress'"
acli jira workitem search --jql "project = MLP AND customfield_13067 = 'Critical' AND type = Bug"
```

---

## Project Operations

### List Projects

```bash
# List all accessible projects
acli jira project list

# List with pagination (all projects)
acli jira project list --paginate

# List recently viewed projects (up to 20)
acli jira project list --recent

# Limit results
acli jira project list --limit 50

# Get JSON output
acli jira project list --json
```

### View Project Details

```bash
# View project information
acli jira project view --key "TEAM"

# Get JSON output
acli jira project view --key "TEAM" --json
```

---

## Filter Operations

### List Filters

```bash
# List your filters
acli jira filter list

# List favorite filters
acli jira filter list

# Get JSON output
acli jira filter list --json
```

### Search with Filters

```bash
# Use a saved filter to search
acli jira workitem search --filter 10001

# Use filter with pagination
acli jira workitem search --filter 10001 --paginate

# Use filter with custom output
acli jira workitem search --filter 10001 --fields "key,summary,status" --csv
```

---

## Output Formats

All commands support multiple output formats:

```bash
# Default human-readable output
acli jira workitem view KEY-123

# JSON output (for scripting/parsing)
acli jira workitem view KEY-123 --json

# CSV output (for spreadsheets)
acli jira workitem search --jql "project = TEAM" --csv
```

---

## Best Practices

### 1. Use JQL for Complex Searches

JQL (Jira Query Language) is powerful for filtering:

- Learn more: [JQL Reference](https://support.atlassian.com/jira-service-management-cloud/docs/use-advanced-search-with-jira-query-language-jql/)
- Test queries in JIRA UI first, then use in CLI

### 2. Leverage Pagination

For large result sets, always use `--paginate`:

```bash
acli jira workitem search --jql "project = TEAM" --paginate
```

### 3. Use JSON for Scripting

Pipe JSON output to `jq` for advanced parsing:

```bash
acli jira workitem view KEY-123 --json | jq '.fields.summary'
acli jira workitem search --jql "project = TEAM" --json | jq '.[] | {key, summary: .fields.summary}'
```

### 4. Save Frequently Used Searches

Create filters in JIRA UI for complex searches, then use:

```bash
acli jira workitem search --filter FILTER_ID
```

---

## Getting Remote Links (Confluence Pages)

The Atlassian CLI doesn't expose remote links through its commands. To retrieve Confluence page links associated with JIRA tickets, use the REST API directly:

```bash
# Load credentials from .env.user.config
set -a
source .env.user.config
set +a

# Get remote links for a ticket
curl -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/rest/api/3/issue/KEY-123/remotelink" | jq

# Get just Confluence links
curl -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/rest/api/3/issue/KEY-123/remotelink" | \
  jq '.[] | select(.object.url | contains("confluence")) | {title: .object.title, url: .object.url}'
```

### Create a Helper Script

```bash
# Save as: get-jira-confluence-links.sh
#!/bin/bash
set -a
source .env.user.config
set +a

ISSUE_KEY="$1"

if [ -z "$ISSUE_KEY" ]; then
  echo "Usage: $0 ISSUE-KEY"
  exit 1
fi

echo "Fetching remote links for $ISSUE_KEY..."
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/rest/api/3/issue/$ISSUE_KEY/remotelink" | \
  jq -r '.[] | "\(.object.title): \(.object.url)"'
```

Make it executable and use:

```bash
chmod +x get-jira-confluence-links.sh
./get-jira-confluence-links.sh MLP-10787
```

---

## Confluence REST API v2 (Read-Only)

The Confluence REST API v2 provides access to read Confluence pages, attachments, children pages, and comments. These operations complement the JIRA CLI commands by allowing you to retrieve linked Confluence content.

**Base URL:** `https://sessionm.atlassian.net/wiki/api/v2`

### Setup

```bash
# Load credentials from .env.user.config
set -a
source .env.user.config
set +a
```

### Get Page by ID

Retrieve a Confluence page by its numeric ID.

```bash
# Get page content (body-format: storage, atlas_doc_format, or view)
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}?body-format=storage" | jq

# Get page with labels
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}?include-labels=true" | jq

# Get specific page info only
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}" | \
  jq '{id, title, spaceId, status, createdAt}'
```

**Example - Get page from a Confluence URL:**

```bash
# Given URL: https://sessionm.atlassian.net/wiki/spaces/SPACE/pages/4883808416/Page+Title
# The page ID is: 4883808416

curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/4883808416?body-format=view" | jq
```

### Get Pages in Space

List pages within a Confluence space.

```bash
# Get pages in a space by space ID
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/spaces/{space_id}/pages" | jq

# Get pages with title filter
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/spaces/{space_id}/pages?title=Test%20Strategy" | jq

# Get pages sorted by modified date (newest first)
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/spaces/{space_id}/pages?sort=-modified-date&limit=10" | jq
```

### Get Page Attachments

List attachments on a Confluence page.

```bash
# Get all attachments for a page
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/attachments" | jq

# Filter by filename
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/attachments?filename=diagram.png" | jq

# Filter by media type
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/attachments?mediaType=image/png" | jq

# List attachment titles and download links
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/attachments" | \
  jq '.results[] | {title, fileSize, mediaType, downloadLink}'
```

### Get Attachment by ID

Get details of a specific attachment.

```bash
# Get attachment details
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/attachments/{attachment_id}" | jq

# Include labels and properties
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/attachments/{attachment_id}?include-labels=true&include-properties=true" | jq
```

### Get Child Pages

Get direct children of a page.

```bash
# Get child pages (deprecated but still works)
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/children" | jq

# Get direct children (preferred method - returns all content types)
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/direct-children" | jq

# Sort children by title
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/direct-children?sort=title" | jq

# List child titles and IDs
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/direct-children" | \
  jq '.results[] | {id, title, type, status}'
```

### Get Page Comments

Retrieve footer and inline comments on a page.

```bash
# Get footer comments for a page
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/footer-comments" | jq

# Get footer comments with body content
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/footer-comments?body-format=storage" | jq

# Get inline comments (attached to specific text)
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/inline-comments" | jq

# Get only open inline comments
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/inline-comments?resolution-status=open" | jq

# Get comment by ID
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/footer-comments/{comment_id}?body-format=view" | jq

# Get children of a comment (replies)
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/footer-comments/{comment_id}/children" | jq
```

### Confluence Helper Script

Create a helper script for common Confluence operations:

```bash
#!/bin/bash
# Save as: confluence-helper.sh

# Load credentials
set -a
source .env.user.config
set +a

BASE_URL="https://sessionm.atlassian.net/wiki/api/v2"

case "$1" in
  page)
    # Get page by ID: ./confluence-helper.sh page 4883808416
    curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
      "$BASE_URL/pages/$2?body-format=view" | jq
    ;;
  attachments)
    # Get page attachments: ./confluence-helper.sh attachments 4883808416
    curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
      "$BASE_URL/pages/$2/attachments" | \
      jq '.results[] | {title, fileSize, mediaType, downloadLink}'
    ;;
  children)
    # Get child pages: ./confluence-helper.sh children 4883808416
    curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
      "$BASE_URL/pages/$2/direct-children" | \
      jq '.results[] | {id, title, type}'
    ;;
  comments)
    # Get comments: ./confluence-helper.sh comments 4883808416
    echo "=== Footer Comments ==="
    curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
      "$BASE_URL/pages/$2/footer-comments?body-format=view" | jq '.results[] | {id, title}'
    echo -e "\n=== Inline Comments ==="
    curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
      "$BASE_URL/pages/$2/inline-comments?body-format=view" | jq '.results[] | {id, title, resolutionStatus}'
    ;;
  *)
    echo "Usage: $0 {page|attachments|children|comments} PAGE_ID"
    echo ""
    echo "Commands:"
    echo "  page PAGE_ID        - Get page content"
    echo "  attachments PAGE_ID - List page attachments"
    echo "  children PAGE_ID    - List child pages"
    echo "  comments PAGE_ID    - List page comments"
    ;;
esac
```

### API Response Examples

**Page Response:**

```json
{
  "id": "4883808416",
  "status": "current",
  "title": "[TS] Pay With Points",
  "spaceId": "65538",
  "parentId": "4883808400",
  "parentType": "page",
  "authorId": "557058:xxxx",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "version": {
    "number": 5,
    "message": "Updated test cases"
  }
}
```

**Attachment Response:**

```json
{
  "id": "att12345",
  "status": "current",
  "title": "test-diagram.png",
  "mediaType": "image/png",
  "fileSize": 45678,
  "downloadLink": "/download/attachments/4883808416/test-diagram.png"
}
```

**Children Response:**

```json
{
  "results": [
    {
      "id": "4883808500",
      "status": "current",
      "title": "Test Cases - Login",
      "type": "page",
      "spaceId": "65538",
      "childPosition": 1
    }
  ]
}
```

---

## Advanced Examples

### Combine with Other Tools

```bash
# Get all open bugs assigned to you
acli jira workitem search \
  --jql "assignee = currentUser() AND type = Bug AND status != Done" \
  --fields "key,summary,priority" \
  --csv > my_bugs.csv

# View multiple tickets
for key in KEY-1 KEY-2 KEY-3; do
  echo "=== $key ==="
  acli jira workitem view $key --fields summary,status
  echo ""
done

# Export project issues to JSON
acli jira workitem search \
  --jql "project = TEAM" \
  --json > team_issues.json
```

### Environment Integration

```bash
# Source credentials from .env.user.config
set -a
source .env.user.config
set +a

# Use in scripts
echo $ATLASSIAN_API_TOKEN | acli jira auth login \
  --email "$ATLASSIAN_USER" \
  --token
```

---

## Additional Resources

- **JQL Guide**: See [references/jql-examples.md](references/jql-examples.md) for more JQL query examples
  ## Usage
  - All queries and direct ticket access are **strictly limited** to the following projects:
    - Merchant Loyalty Program (**MLP**)
    - Testing Center of Excellence (**TCOE**)
  - Any search or direct access to a Jira ticket must be filtered to these two projects only.
  - If a request attempts to search or access any other project or Jira ticket (not MLP-xxx or TCOE-xxx), the skill will inform the user: _"This skill is limited to Merchant Loyalty Program (MLP) and Testing Center of Excellence (TCOE) projects only. Other projects are not supported."_
  - This applies to all search operations and direct ticket access.
- **Official Documentation**: [Atlassian CLI Docs](https://developer.atlassian.com/cloud/acli/)

  ## Examples

  ```bash
  # Search for issues in MLP
  acli jira workitem search --jql "project = MLP AND status = 'Open'"

  # Access a Jira ticket in TCOE
  acli jira workitem view TCOE-5678
  ```

  ## Limitations
  - Only supports Jira and Confluence at this time
  - **Only MLP and TCOE projects are supported** (all queries are filtered)
  - Any attempt to access other projects or tickets will result in an informative message about this limitation
  - Some advanced filters may require admin permissions

---

## Troubleshooting

| Issue              | Cause                        | Solution                                            |
| ------------------ | ---------------------------- | --------------------------------------------------- |
| `401 Unauthorized` | Invalid or expired token     | Regenerate API token and re-authenticate            |
| `403 Forbidden`    | Insufficient permissions     | Check user permissions in JIRA                      |
| `404 Not Found`    | Invalid issue key or project | Verify key/project exists in sessionm.atlassian.net |
| Token not found    | Environment variable not set | Source `.env.user.config` or export token manually  |
| Connection timeout | Network or site issues       | Check sessionm.atlassian.net availability           |

### Get Help

```bash
# General help
acli --help

# JIRA commands help
acli jira --help

# Specific command help
acli jira workitem view --help
acli jira workitem search --help
```

---

## Important Notes

⚠️ **READ-ONLY OPERATIONS ONLY**

This skill set is designed for **reading JIRA and Confluence data only**. The following operations are **NOT included**:

### JIRA Operations NOT Included:

- Creating work items (`acli jira workitem create`)
- Editing work items (`acli jira workitem edit`)
- Deleting work items (`acli jira workitem delete`)
- Transitioning work items (`acli jira workitem transition`)
- Assigning work items (`acli jira workitem assign`)
- Modifying projects or configurations

### Confluence Operations NOT Included:

- Creating pages (`POST /pages`)
- Updating pages (`PUT /pages/{id}`)
- Deleting pages (`DELETE /pages/{id}`)
- Creating/updating/deleting attachments
- Creating/updating/deleting comments

For write operations, use the Atlassian MCP server or the JIRA/Confluence web interface.

`````
This is the description of what the code block changes:
<changeDescription>
Update Usage, Examples, and Limitations sections to enforce MLP and TCOE restriction.
</changeDescription>

This is the code block that represents the suggested code change:
````skill
## Usage
- Search for Jira issues by key, summary, or status **only in MLP or TCOE projects**
- Access Jira tickets directly (**only MLP-xxx or TCOE-xxx issues allowed**)
- Query Confluence pages (if related to MLP or TCOE)
- Filter results by project, assignee, or other fields (project filter is always enforced)

## Examples
```bash
# Search for issues in MLP
atlassian-cli search --project MLP --status Open

# Access a Jira ticket in TCOE
atlassian-cli get --issue TCOE-5678
```

## Limitations
- Only supports Jira and Confluence at this time
- Only MLP and TCOE projects are supported (all queries are filtered)
- Some advanced filters may require admin permissions

// ...existing code...
`````
