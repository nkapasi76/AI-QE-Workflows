# Atlassian CLI Command Reference

Complete reference for read-only JIRA commands using Atlassian CLI.

## Contents

- [Work Item Commands](#work-item-commands)
- [Project Commands](#project-commands)
- [Filter Commands](#filter-commands)
- [Board Commands](#board-commands)
- [Sprint Commands](#sprint-commands)
- [Authentication Commands](#authentication-commands)
- [Confluence REST API v2](#confluence-rest-api-v2-read-only)
  - [Page Operations](#page-operations)
  - [Attachment Operations](#attachment-operations)
  - [Children Operations](#children-operations)
  - [Comment Operations](#comment-operations)

---

## Work Item Commands

### `acli jira workitem view`

Retrieve information about JIRA work items.

**Syntax:**

```bash
acli jira workitem view [key] [flags]
```

**Flags:**

- `-f, --fields string` - List of fields to return (comma-separated)
  - `*all` - returns all fields
  - `*navigable` - returns navigable fields
  - Prefix with `-` to exclude (e.g., `-description`)
  - Default: `key,issuetype,summary,status,assignee,description`
- `--json` - Generate JSON output
- `-w, --web` - View in web browser
- `-h, --help` - Show help

**Examples:**

```bash
# View work item with default fields
acli jira workitem view KEY-123

# View with specific fields
acli jira workitem view KEY-123 --fields summary,comment

# View all fields
acli jira workitem view KEY-123 --fields '*all'

# Exclude specific fields
acli jira workitem view KEY-123 --fields '*navigable,-comment'

# Get JSON output
acli jira workitem view KEY-123 --json

# Open in browser
acli jira workitem view KEY-123 --web
```

---

### `acli jira workitem search`

Search for work items using JQL or saved filters.

**Syntax:**

```bash
acli jira workitem search [flags]
```

**Flags:**

- `-j, --jql string` - JQL query to search
- `--filter string` - Filter ID to use
- `-f, --fields string` - Comma-separated list of fields to display
  - Default: `issuetype,key,assignee,priority,status,summary`
- `-l, --limit int` - Maximum number of work items to fetch
- `--paginate` - Fetch all results by paginating
- `--count` - Return only the count of work items
- `--json` - Generate JSON output
- `--csv` - Generate CSV output
- `-w, --web` - Open search in web browser
- `-h, --help` - Show help

**Examples:**

```bash
# Search with JQL
acli jira workitem search --jql "project = TEAM"

# Paginate all results
acli jira workitem search --jql "project = TEAM" --paginate

# Get count only
acli jira workitem search --jql "project = TEAM" --count

# Custom fields and CSV output
acli jira workitem search --jql "project = TEAM" --fields "key,summary,assignee" --csv

# Limit results
acli jira workitem search --jql "project = TEAM" --limit 50 --json

# Use saved filter
acli jira workitem search --filter 10001 --web
```

---

## Project Commands

### `acli jira project list`

List projects visible to the user.

**Syntax:**

```bash
acli jira project list [flags]
```

**Flags:**

- `-l, --limit int` - Maximum number of projects to fetch (default: 30)
- `--paginate` - Fetch all pages of results (ignores --limit)
- `--recent` - Returns up to 20 recently viewed projects
- `--json` - Generate JSON output
- `-h, --help` - Show help

**Examples:**

```bash
# List up to 20 recently viewed projects
acli jira project list --recent

# List all projects
acli jira project list --paginate

# List 50 projects in JSON
acli jira project list --limit 50 --json
```

---

### `acli jira project view`

Fetch details about a specific JIRA project.

**Syntax:**

```bash
acli jira project view [flags]
```

**Flags:**

- `--key string` - Key of the project to fetch (required)
- `-j, --json` - Output in JSON format
- `-h, --help` - Show help

**Examples:**

```bash
# View project details
acli jira project view --key "TEAM"

# Get JSON output
acli jira project view --key "TEAM" --json
```

---

## Filter Commands

### `acli jira filter list`

List filters that are either yours or marked as favorites.

**Syntax:**

```bash
acli jira filter list [flags]
```

**Flags:**

- `--json` - Generate JSON output
- `-h, --help` - Show help

**Examples:**

```bash
# List your filters
acli jira filter list

# Get JSON output
acli jira filter list --json
```

---

### `acli jira filter search`

Search for JIRA filters.

**Syntax:**

```bash
acli jira filter search [flags]
```

**Flags:**

- `--json` - Generate JSON output
- `-h, --help` - Show help

**Examples:**

```bash
# Search for filters
acli jira filter search

# Get JSON output
acli jira filter search --json
```

---

## Board Commands

### `acli jira board`

Jira board commands (read-only).

**Available subcommands:**

- `acli jira board list` - List boards
- `acli jira board view` - View board details

Refer to the official documentation for detailed board command usage.

---

## Sprint Commands

### `acli jira sprint`

Jira sprint commands (read-only).

**Available subcommands:**

- `acli jira sprint list` - List sprints in a board
- `acli jira sprint view` - View sprint details

Refer to the official documentation for detailed sprint command usage.

---

## Authentication Commands

### `acli jira auth login`

Authenticate with sessionm.atlassian.net.

**Syntax:**

```bash
acli jira auth login [flags]
```

**Flags:**

- `--site string` - Atlassian site URL (e.g., sessionm.atlassian.net)
- `--email string` - Email address for authentication
- `--token` - Use API token authentication (reads from stdin)
- `--web` - Use OAuth authentication (opens browser)
- `-h, --help` - Show help

**Examples:**

```bash
# Login with API token (from stdin)
echo $ATLASSIAN_API_TOKEN | acli jira auth login \
  --site "sessionm.atlassian.net" \
  --email "user@sessionm.com" \
  --token

# Login with OAuth (browser)
acli jira auth login --web
```

---

### `acli jira auth status`

Show JIRA account authentication status.

**Syntax:**

```bash
acli jira auth status
```

**Examples:**

```bash
# Check authentication status
acli jira auth status
```

---

### `acli jira auth logout`

Logout from JIRA account.

**Syntax:**

```bash
acli jira auth logout
```

**Examples:**

```bash
# Logout
acli jira auth logout
```

---

### `acli jira auth switch`

Switch between multiple authenticated JIRA accounts.

**Syntax:**

```bash
acli jira auth switch
```

**Examples:**

```bash
# Switch accounts (interactive)
acli jira auth switch
```

---

## Output Formats

### JSON Output

Most commands support `--json` flag for machine-readable output:

```bash
# Get JSON output
acli jira workitem view KEY-123 --json

# Parse with jq
acli jira workitem view KEY-123 --json | jq '.fields.summary'
```

### CSV Output

Search commands support `--csv` flag for spreadsheet export:

```bash
# Export to CSV
acli jira workitem search --jql "project = TEAM" --csv > issues.csv
```

### Human-Readable Output

Default output is human-readable formatted text.

---

## Confluence REST API v2 (Read-Only)

The Confluence REST API v2 provides programmatic access to Confluence content. All operations below are **read-only**.

**Base URL:** `https://sessionm.atlassian.net/wiki/api/v2`

### Authentication

```bash
# Load credentials from .env.user.config
export $(grep ATLASSIAN_API_TOKEN .env.user.config | xargs)
export $(grep ATLASSIAN_USER .env.user.config | xargs)
```

### Page Operations

#### Get Page by ID

```bash
GET /pages/{id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `body-format` | string | `storage`, `atlas_doc_format`, or `view` |
| `get-draft` | boolean | Retrieve draft version |
| `version` | integer | Specific version number |
| `include-labels` | boolean | Include page labels |
| `include-properties` | boolean | Include content properties |
| `include-operations` | boolean | Include permitted operations |
| `include-likes` | boolean | Include likes information |
| `include-versions` | boolean | Include version history |

**Examples:**

```bash
# Get page content
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}?body-format=view" | jq

# Get page with labels
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}?include-labels=true" | jq
```

#### Get Pages in Space

```bash
GET /spaces/{id}/pages
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | string | Filter by title (partial match) |
| `status` | array | `current`, `archived`, `deleted`, `trashed` |
| `body-format` | string | Body content format |
| `sort` | string | `id`, `-id`, `created-date`, `-created-date`, `modified-date`, `-modified-date`, `title`, `-title` |
| `limit` | integer | Max results (default 25, max 250) |
| `cursor` | string | Pagination cursor |

**Examples:**

```bash
# Get pages in space
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/spaces/{space_id}/pages" | jq

# Filter by title
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/spaces/{space_id}/pages?title=Test%20Strategy" | jq
```

---

### Attachment Operations

#### Get Attachments for Page

```bash
GET /pages/{id}/attachments
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sort` | string | `created-date`, `-created-date`, `modified-date`, `-modified-date` |
| `status` | array | `current`, `archived`, `trashed` |
| `mediaType` | string | Filter by MIME type |
| `filename` | string | Filter by filename |
| `limit` | integer | Max results |
| `cursor` | string | Pagination cursor |

**Examples:**

```bash
# Get all attachments
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/attachments" | jq

# Filter by media type
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/attachments?mediaType=image/png" | jq
```

#### Get Attachment by ID

```bash
GET /attachments/{id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `version` | integer | Specific version |
| `include-labels` | boolean | Include labels |
| `include-properties` | boolean | Include properties |
| `include-operations` | boolean | Include operations |
| `include-versions` | boolean | Include version history |

---

### Children Operations

#### Get Direct Children of Page

```bash
GET /pages/{id}/direct-children
```

Returns all types of child content (pages, databases, embeds, folders, whiteboards).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sort` | string | Sort order (`title`, `-title`, `created-date`, etc.) |
| `limit` | integer | Max results |
| `cursor` | string | Pagination cursor |

**Examples:**

```bash
# Get direct children
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/direct-children" | jq

# Get child pages only (deprecated but still works)
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/children" | jq
```

---

### Comment Operations

#### Get Footer Comments for Page

```bash
GET /pages/{id}/footer-comments
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `body-format` | string | `storage`, `atlas_doc_format`, `view` |
| `status` | array | `current`, `archived`, `trashed`, `deleted`, `historical`, `draft` |
| `sort` | string | `id`, `-id`, `created-date`, `-created-date` |
| `limit` | integer | Max results |
| `cursor` | string | Pagination cursor |

**Examples:**

```bash
# Get footer comments
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/footer-comments?body-format=view" | jq
```

#### Get Inline Comments for Page

```bash
GET /pages/{id}/inline-comments
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `body-format` | string | Body content format |
| `status` | array | Comment status filter |
| `resolution-status` | array | `resolved`, `open`, `dangling`, `reopened` |
| `sort` | string | Sort order |
| `limit` | integer | Max results |
| `cursor` | string | Pagination cursor |

**Examples:**

```bash
# Get open inline comments
curl -s -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/wiki/api/v2/pages/{page_id}/inline-comments?resolution-status=open" | jq
```

#### Get Comment by ID

```bash
GET /footer-comments/{comment-id}
GET /inline-comments/{comment-id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `body-format` | string | `storage`, `atlas_doc_format`, `view` |
| `version` | integer | Specific version |
| `include-properties` | boolean | Include properties |
| `include-operations` | boolean | Include operations |
| `include-likes` | boolean | Include likes |
| `include-versions` | boolean | Include versions |

#### Get Comment Replies

```bash
GET /footer-comments/{id}/children
GET /inline-comments/{id}/children
```

---

### Confluence API Endpoints Summary

| Endpoint                         | Method | Description                  |
| -------------------------------- | ------ | ---------------------------- |
| `/pages/{id}`                    | GET    | Get page by ID               |
| `/pages`                         | GET    | Get all pages                |
| `/spaces/{id}/pages`             | GET    | Get pages in space           |
| `/pages/{id}/attachments`        | GET    | Get page attachments         |
| `/attachments/{id}`              | GET    | Get attachment by ID         |
| `/pages/{id}/direct-children`    | GET    | Get direct children of page  |
| `/pages/{id}/children`           | GET    | Get child pages (deprecated) |
| `/pages/{id}/footer-comments`    | GET    | Get footer comments          |
| `/pages/{id}/inline-comments`    | GET    | Get inline comments          |
| `/footer-comments/{id}`          | GET    | Get footer comment by ID     |
| `/inline-comments/{id}`          | GET    | Get inline comment by ID     |
| `/footer-comments/{id}/children` | GET    | Get comment replies          |
| `/inline-comments/{id}/children` | GET    | Get inline comment replies   |

---

## Field Names

Common field names for `--fields` flag:

| Field             | Description                         |
| ----------------- | ----------------------------------- |
| `key`             | Issue key (e.g., KEY-123)           |
| `summary`         | Issue summary/title                 |
| `description`     | Issue description                   |
| `status`          | Current status                      |
| `issuetype`       | Issue type (Bug, Task, Story, etc.) |
| `priority`        | Priority level                      |
| `assignee`        | Assigned user                       |
| `reporter`        | Reporter user                       |
| `created`         | Creation date                       |
| `updated`         | Last update date                    |
| `comment`         | Comments                            |
| `attachment`      | Attachments                         |
| `labels`          | Issue labels                        |
| `components`      | Components                          |
| `fixVersions`     | Fix versions                        |
| `affectsVersions` | Affects versions                    |

### Special Field Values

- `*all` - All fields
- `*navigable` - All navigable fields
- `-fieldname` - Exclude specific field

---

## REST API for Remote Links

The Atlassian CLI doesn't expose remote links (Confluence pages, web links). Use the REST API directly:

### Get Remote Links

```bash
# Load credentials from .env.user.config
export $(grep ATLASSIAN_API_TOKEN .env.user.config | xargs)
export $(grep ATLASSIAN_USER .env.user.config | xargs)

# Get all remote links for an issue
curl -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/rest/api/3/issue/KEY-123/remotelink"

# Pretty print with jq
curl -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/rest/api/3/issue/KEY-123/remotelink" | \
  jq '.[] | {title: .object.title, url: .object.url}'

# Filter only Confluence links
curl -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/rest/api/3/issue/KEY-123/remotelink" | \
  jq '.[] | select(.object.url | contains("confluence"))'
```

### API Endpoints

| Endpoint                                               | Description              |
| ------------------------------------------------------ | ------------------------ |
| `/rest/api/3/issue/{issueIdOrKey}/remotelink`          | Get all remote links     |
| `/rest/api/3/issue/{issueIdOrKey}/remotelink/{linkId}` | Get specific remote link |

---

## Exit Codes

| Code | Meaning              |
| ---- | -------------------- |
| 0    | Success              |
| 1    | General error        |
| 2    | Authentication error |
| 3    | Permission denied    |
| 4    | Not found            |

---

## See Also

- [JQL Examples](jql-examples.md) - Common JQL query patterns
- [Setup Guide](setup.md) - Installation and authentication
- [Official Docs](https://developer.atlassian.com/cloud/acli/) - Complete Atlassian CLI documentation
