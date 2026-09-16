# Atlassian CLI Skill Scripts (PowerShell)

These scripts are part of the `atlassian-cli` Agent Skill and follow the Agent Skills resource layout.

## Scripts

- `load-atlassian-env.ps1`
  - Loads `ATLASSIAN_API_TOKEN` and `ATLASSIAN_USER` from `.env.user.config`

- `initialize-ticket-workspace.ps1`
  - Creates `tmp/{TICKET_KEY}` workspace directories

- `get-jira-ticket-type.ps1`
  - Fetches issue type/project metadata JSON for ticket validation

- `get-jira-workitem.ps1`
  - Fetches Jira work item JSON (and optional text output)

- `get-confluence-page.ps1`
  - Fetches Confluence page JSON via REST API and writes to output file

## Quick Usage

```powershell
./.github/skills/atlassian-cli/scripts/initialize-ticket-workspace.ps1 -TicketKey "MLP-12345"
./.github/skills/atlassian-cli/scripts/get-jira-ticket-type.ps1 -TicketKey "MLP-12345"
./.github/skills/atlassian-cli/scripts/get-jira-workitem.ps1 -TicketKey "MLP-12345" -IncludeText
./.github/skills/atlassian-cli/scripts/get-confluence-page.ps1 -PageId "123456789" -BodyFormat "storage"
```
