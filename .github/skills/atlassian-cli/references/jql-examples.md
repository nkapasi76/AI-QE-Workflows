# JQL Examples for Atlassian CLI

Common JQL (Jira Query Language) patterns for searching JIRA issues with `acli`.

## Contents

- [Basic Queries](#basic-queries)
- [User-Based Queries](#user-based-queries)
- [Status Queries](#status-queries)
- [Time-Based Queries](#time-based-queries)
- [Priority and Type Queries](#priority-and-type-queries)
- [Project Queries](#project-queries)
- [Complex Queries](#complex-queries)
- [Useful Functions](#useful-functions)

---

## Basic Queries

### Search by Project

```bash
# All issues in a project
acli jira workitem search --jql "project = TEAM"

# Multiple projects
acli jira workitem search --jql "project IN (TEAM, CORE, API)"
```

### Search by Issue Key

```bash
# Specific issue
acli jira workitem search --jql "key = TEAM-123"

# Multiple issues
acli jira workitem search --jql "key IN (TEAM-123, TEAM-124, TEAM-125)"

# Issues in a range
acli jira workitem search --jql "key >= TEAM-100 AND key <= TEAM-200"
```

### Search by Text

```bash
# Search in summary
acli jira workitem search --jql "summary ~ 'authentication'"

# Search in description
acli jira workitem search --jql "description ~ 'bug fix'"

# Search in summary or description
acli jira workitem search --jql "text ~ 'API endpoint'"
```

---

## User-Based Queries

### Assignee Queries

```bash
# Issues assigned to you
acli jira workitem search --jql "assignee = currentUser()"

# Issues assigned to specific user
acli jira workitem search --jql "assignee = 'user@sessionm.com'"

# Unassigned issues
acli jira workitem search --jql "assignee IS EMPTY"

# Issues assigned to anyone
acli jira workitem search --jql "assignee IS NOT EMPTY"
```

### Reporter Queries

```bash
# Issues you reported
acli jira workitem search --jql "reporter = currentUser()"

# Issues reported by specific user
acli jira workitem search --jql "reporter = 'user@sessionm.com'"
```

### Watcher Queries

```bash
# Issues you're watching
acli jira workitem search --jql "watcher = currentUser()"
```

---

## Status Queries

### By Status

```bash
# Issues with specific status
acli jira workitem search --jql "status = 'In Progress'"

# Multiple statuses
acli jira workitem search --jql "status IN ('To Do', 'In Progress')"

# Not in status
acli jira workitem search --jql "status != 'Done'"

# Open issues (not closed)
acli jira workitem search --jql "status NOT IN ('Done', 'Closed')"
```

### Status Categories

```bash
# All to-do items
acli jira workitem search --jql "statusCategory = 'To Do'"

# All in-progress items
acli jira workitem search --jql "statusCategory = 'In Progress'"

# All done items
acli jira workitem search --jql "statusCategory = 'Done'"
```

---

## Time-Based Queries

### Created Date

```bash
# Created today
acli jira workitem search --jql "created >= startOfDay()"

# Created this week
acli jira workitem search --jql "created >= startOfWeek()"

# Created in the last 7 days
acli jira workitem search --jql "created >= -7d"

# Created in specific date range
acli jira workitem search --jql "created >= '2026-01-01' AND created <= '2026-01-31'"
```

### Updated Date

```bash
# Updated today
acli jira workitem search --jql "updated >= startOfDay()"

# Updated this week
acli jira workitem search --jql "updated >= startOfWeek()"

# Updated in the last 7 days
acli jira workitem search --jql "updated >= -7d"

# Not updated in 30 days (stale issues)
acli jira workitem search --jql "updated <= -30d"
```

### Due Date

```bash
# Overdue issues
acli jira workitem search --jql "duedate < now()"

# Due today
acli jira workitem search --jql "duedate = now()"

# Due this week
acli jira workitem search --jql "duedate >= startOfWeek() AND duedate <= endOfWeek()"

# Due in next 7 days
acli jira workitem search --jql "duedate <= 7d"
```

---

## Priority and Type Queries

### Priority

```bash
# High priority issues
acli jira workitem search --jql "priority = High"

# Critical or High priority
acli jira workitem search --jql "priority IN (Critical, High)"

# Not low priority
acli jira workitem search --jql "priority != Low"
```

### Issue Type

```bash
# All bugs
acli jira workitem search --jql "type = Bug"

# Stories and tasks
acli jira workitem search --jql "type IN (Story, Task)"

# Not subtasks
acli jira workitem search --jql "type != Sub-task"
```

---

## Project Queries

### Sprint Queries

```bash
# Issues in active sprint
acli jira workitem search --jql "sprint IN openSprints()"

# Issues in specific sprint
acli jira workitem search --jql "sprint = 'Sprint 42'"

# Issues not in any sprint
acli jira workitem search --jql "sprint IS EMPTY"
```

### Version Queries

```bash
# Issues in specific fix version
acli jira workitem search --jql "fixVersion = '1.0.0'"

# Issues without fix version
acli jira workitem search --jql "fixVersion IS EMPTY"

# Issues affecting specific version
acli jira workitem search --jql "affectedVersion = '1.0.0'"
```

### Component Queries

```bash
# Issues in specific component
acli jira workitem search --jql "component = 'API'"

# Issues with multiple components
acli jira workitem search --jql "component IN ('API', 'Frontend')"

# Issues without component
acli jira workitem search --jql "component IS EMPTY"
```

### Label Queries

```bash
# Issues with specific label
acli jira workitem search --jql "labels = 'production'"

# Issues with any of multiple labels
acli jira workitem search --jql "labels IN ('bug', 'critical')"

# Issues without labels
acli jira workitem search --jql "labels IS EMPTY"
```

---

## Complex Queries

### My Active Work

```bash
# My open issues
acli jira workitem search --jql "assignee = currentUser() AND status != Done"

# My issues in progress
acli jira workitem search --jql "assignee = currentUser() AND status = 'In Progress'"

# My issues due soon
acli jira workitem search --jql "assignee = currentUser() AND duedate <= 7d AND status != Done"
```

### Team Queries

```bash
# Open bugs in project
acli jira workitem search --jql "project = TEAM AND type = Bug AND status != Done"

# High priority unassigned issues
acli jira workitem search --jql "project = TEAM AND priority = High AND assignee IS EMPTY"

# Issues created this sprint
acli jira workitem search --jql "project = TEAM AND created >= startOfWeek() AND sprint IN openSprints()"
```

### Quality Assurance

```bash
# Recently resolved bugs
acli jira workitem search --jql "type = Bug AND status = Done AND resolved >= -7d"

# Unresolved critical issues
acli jira workitem search --jql "priority = Critical AND resolution IS EMPTY"

# Issues in QA
acli jira workitem search --jql "status = 'QA Review' ORDER BY priority DESC"
```

### Project Management

```bash
# Stale issues (not updated in 30 days)
acli jira workitem search --jql "project = TEAM AND updated <= -30d AND status != Done"

# Issues blocked
acli jira workitem search --jql "status = Blocked ORDER BY created ASC"

# Issues with no sprint
acli jira workitem search --jql "project = TEAM AND sprint IS EMPTY AND type != Epic"
```

---

## Useful Functions

### Time Functions

| Function         | Description            |
| ---------------- | ---------------------- |
| `now()`          | Current date and time  |
| `startOfDay()`   | Start of current day   |
| `endOfDay()`     | End of current day     |
| `startOfWeek()`  | Start of current week  |
| `endOfWeek()`    | End of current week    |
| `startOfMonth()` | Start of current month |
| `endOfMonth()`   | End of current month   |
| `startOfYear()`  | Start of current year  |
| `endOfYear()`    | End of current year    |

### User Functions

| Function             | Description                 |
| -------------------- | --------------------------- |
| `currentUser()`      | Currently logged-in user    |
| `membersOf("group")` | Members of a specific group |

### Sprint Functions

| Function          | Description        |
| ----------------- | ------------------ |
| `openSprints()`   | All open sprints   |
| `closedSprints()` | All closed sprints |

---

## Operators

### Comparison Operators

| Operator | Description       | Example                              |
| -------- | ----------------- | ------------------------------------ |
| `=`      | Equals            | `status = 'Done'`                    |
| `!=`     | Not equals        | `status != 'Done'`                   |
| `>`      | Greater than      | `priority > Medium`                  |
| `>=`     | Greater or equal  | `created >= '2026-01-01'`            |
| `<`      | Less than         | `duedate < now()`                    |
| `<=`     | Less or equal     | `updated <= -7d`                     |
| `IN`     | In list           | `status IN ('To Do', 'In Progress')` |
| `NOT IN` | Not in list       | `status NOT IN ('Done', 'Closed')`   |
| `IS`     | Is (for null)     | `assignee IS EMPTY`                  |
| `IS NOT` | Is not (for null) | `assignee IS NOT EMPTY`              |
| `~`      | Contains text     | `summary ~ 'authentication'`         |

### Logical Operators

| Operator | Description                   | Example                                  |
| -------- | ----------------------------- | ---------------------------------------- |
| `AND`    | Both conditions must be true  | `project = TEAM AND status = 'Done'`     |
| `OR`     | Either condition must be true | `priority = High OR priority = Critical` |
| `NOT`    | Negates condition             | `NOT status = 'Done'`                    |

### Ordering

```bash
# Sort by priority descending
acli jira workitem search --jql "project = TEAM ORDER BY priority DESC"

# Sort by created date ascending
acli jira workitem search --jql "project = TEAM ORDER BY created ASC"

# Multiple sort fields
acli jira workitem search --jql "project = TEAM ORDER BY priority DESC, created ASC"
```

---

## Best Practices

### 1. Test Queries in JIRA UI First

Before using JQL in CLI, test it in the JIRA web interface's advanced search to ensure it returns expected results.

### 2. Use Quotes for Values with Spaces

```bash
# Correct
acli jira workitem search --jql "status = 'In Progress'"

# Incorrect (will fail)
acli jira workitem search --jql "status = In Progress"
```

### 3. Escape Special Characters

```bash
# Use backslash to escape quotes
acli jira workitem search --jql "summary ~ \"user's account\""
```

### 4. Save Complex Queries as Filters

For frequently used complex queries, save them as filters in JIRA UI, then use:

```bash
acli jira workitem search --filter 10001
```

### 5. Use Pagination for Large Results

```bash
# Always use --paginate for large result sets
acli jira workitem search --jql "project = TEAM" --paginate
```

---

## Common Use Cases

### Daily Standup

```bash
# What did I work on yesterday?
acli jira workitem search --jql "assignee = currentUser() AND updated >= -1d"

# What am I working on today?
acli jira workitem search --jql "assignee = currentUser() AND status = 'In Progress'"
```

### Sprint Planning

```bash
# Backlog items (no sprint)
acli jira workitem search --jql "project = TEAM AND sprint IS EMPTY AND type != Epic"

# Current sprint items
acli jira workitem search --jql "project = TEAM AND sprint IN openSprints()"
```

### Bug Triage

```bash
# Unassigned bugs
acli jira workitem search --jql "project = TEAM AND type = Bug AND assignee IS EMPTY"

# Critical bugs
acli jira workitem search --jql "project = TEAM AND type = Bug AND priority = Critical"
```

---

## See Also

- [Command Reference](commands.md) - Complete command documentation
- [JQL Documentation](https://support.atlassian.com/jira-service-management-cloud/docs/use-advanced-search-with-jira-query-language-jql/) - Official JQL reference
- [Setup Guide](setup.md) - Installation and authentication
