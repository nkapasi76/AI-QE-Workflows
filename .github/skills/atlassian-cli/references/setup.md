# Atlassian CLI Setup Guide

Complete setup instructions for using Atlassian CLI with sessionm.atlassian.net.

## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Authentication](#authentication)
- [Verification](#verification)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows
- **Terminal**: bash, zsh, or PowerShell
- **Network**: Access to sessionm.atlassian.net

### Required Credentials

You need an API token from your Atlassian account. The token is already configured in:

```
.env.user.config
ATLASSIAN_API_TOKEN="your-token-here"
```

If you cannot find it and need to generate a new token:

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "CLI Access")
4. Copy the token and save it in `.env.user.config` as `ATLASSIAN_API_TOKEN=<token>`

---

## Installation

### macOS

#### Option 1: Homebrew (Recommended)

```bash
# Add Atlassian tap
brew tap atlassian/homebrew-acli

# Install acli
brew install acli
```

#### Option 2: Manual Installation

```bash
# Download for Apple Silicon
curl -LO "https://acli.atlassian.com/darwin/latest/acli_darwin_arm64/acli"

# OR download for Intel
curl -LO "https://acli.atlassian.com/darwin/latest/acli_darwin_amd64/acli"

# Make executable
chmod +x ./acli

# Move to PATH
sudo mv ./acli /usr/local/bin/acli
sudo chown root: /usr/local/bin/acli
```

### Linux

```bash
# Download latest version
curl -LO "https://acli.atlassian.com/linux/latest/acli_linux_amd64/acli"

# Make executable
chmod +x ./acli

# Move to PATH
sudo mv ./acli /usr/local/bin/acli
```

### Windows

```powershell
# Set the directory where ACLI will be installed
$installationFolder = 'C:\Program Files\Atlassian CLI'

# Create the installation directory if it doesn't exist
if (-not (Test-Path $installationFolder)) {
    New-Item -ItemType Directory -Path $installationFolder -Force
}

# Move to the installation directory
Push-Location $installationFolder

# Download the CLI executable
$downloadLink = "https://acli.atlassian.com/windows/latest/acli_windows_amd64/acli.exe"
Invoke-RestMethod -Uri $downloadLink -OutFile "atlassian-cli.exe"

# Modify PATH variable to include ACLI
$currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentUserPath -notlike "*$installationFolder*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentUserPath;$installationFolder", "User")
}
```

### Verify Installation

```bash
acli --version
```

---

## Authentication

### Method 1: API Token (Recommended)

This method uses the token and email from `.env.user.config`.

#### Step 1: Export Credentials from Environment

```bash
# Load credentials from .env.user.config
export $(grep ATLASSIAN_API_TOKEN .env.user.config | xargs)
export $(grep ATLASSIAN_USER .env.user.config | xargs)
```

#### Step 2: Authenticate

```bash
# Authenticate with API token
echo $ATLASSIAN_API_TOKEN | acli jira auth login \
  --site "sessionm.atlassian.net" \
  --email "$ATLASSIAN_USER" \
  --token
```

#### Alternative: Read Token from File

```bash
# Create token file (temporary)
echo $ATLASSIAN_API_TOKEN > /tmp/acli-token.txt

# Authenticate
acli jira auth login \
  --site "sessionm.atlassian.net" \
  --email "your.email@sessionm.com" \
  --token < /tmp/acli-token.txt

# Remove token file
rm /tmp/acli-token.txt
```

### Method 2: OAuth (Browser-Based)

This method opens a browser for authentication.

```bash
# Start OAuth flow
acli jira auth login --web
```

1. Browser opens automatically
2. Select "sessionm" site
3. Click "Accept" to grant permissions
4. Return to terminal
5. Select "sessionm.atlassian.net" from the list

---

## Verification

### Check Authentication Status

```bash
acli jira auth status
```

**Expected output:**

```
✓ Logged in to sessionm.atlassian.net as your.email@sessionm.com
```

### Test Commands

```bash
# List your projects
acli jira project list --recent

# Search for issues assigned to you
acli jira workitem search --jql "assignee = currentUser()" --limit 5
```

If these commands work, you're successfully authenticated! 🎉

---

## Configuration

### Shell Integration

#### Bash/Zsh Autocompletion

```bash
# For bash
acli completion bash > /usr/local/etc/bash_completion.d/acli

# For zsh
acli completion zsh > /usr/local/share/zsh/site-functions/_acli
```

#### Add to Shell Profile

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Load Atlassian token from .env.user.config
if [ -f ~/.env.user.config ]; then
  export $(grep ATLASSIAN_API_TOKEN ~/.env.user.config | xargs)
fi

# Alias for quick JIRA search
alias jira-mine='acli jira workitem search --jql "assignee = currentUser() AND status != Done"'
alias jira-view='acli jira workitem view'
```

### Environment Variables

Create a `.aclirc` file in your home directory:

```bash
# ~/.aclirc
export ACLI_SITE="sessionm.atlassian.net"
export ACLI_EMAIL="your.email@sessionm.com"
```

---

## Common Setup Scenarios

### Scenario 1: First-Time Setup (macOS)

Complete setup from scratch:

```bash
# 1. Install via Homebrew
brew tap atlassian/homebrew-acli
brew install acli

# 2. Export credentials from .env.user.config
export $(grep ATLASSIAN_API_TOKEN .env.user.config | xargs)
export $(grep ATLASSIAN_USER .env.user.config | xargs)

# 3. Authenticate
echo $ATLASSIAN_API_TOKEN | acli jira auth login \
  --site "sessionm.atlassian.net" \
  --email "$ATLASSIAN_USER" \
  --token

# 4. Verify
acli jira auth status

# 5. Test
acli jira project list --recent
```

### Scenario 2: Re-authentication (Token Expired)

If you see authentication errors:

```bash
# 1. Generate new API token
# Visit: https://id.atlassian.com/manage-profile/security/api-tokens

# 2. Update .env.user.config with new token

# 3. Logout
acli jira auth logout

# 4. Re-authenticate
export $(grep ATLASSIAN_API_TOKEN .env.user.config | xargs)
export $(grep ATLASSIAN_USER .env.user.config | xargs)
echo $ATLASSIAN_API_TOKEN | acli jira auth login \
  --site "sessionm.atlassian.net" \
  --email "$ATLASSIAN_USER" \
  --token
```

### Scenario 3: Multiple Accounts

If you work with multiple Atlassian sites:

```bash
# Authenticate to first site
acli jira auth login --site "sessionm.atlassian.net" --web

# Authenticate to second site
acli jira auth login --site "other.atlassian.net" --web

# Switch between accounts
acli jira auth switch
```

---

## Troubleshooting

### Issue: `401 Unauthorized`

**Cause**: Invalid or expired API token

**Solution**:

1. Generate a new API token from [Atlassian Account](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Update `.env.user.config`
3. Re-authenticate:
   ```bash
   acli jira auth logout
   export $(grep ATLASSIAN_API_TOKEN .env.user.config | xargs)
   echo $ATLASSIAN_API_TOKEN | acli jira auth login \
     --site "sessionm.atlassian.net" \
     --email "your.email@sessionm.com" \
     --token
   ```

### Issue: `403 Forbidden`

**Cause**: Insufficient permissions in JIRA

**Solution**:

- Check with your JIRA admin to ensure you have appropriate access
- Verify you're using the correct site: `sessionm.atlassian.net`

### Issue: `404 Not Found`

**Cause**: Invalid site URL, project key, or issue key

**Solution**:

- Verify the site: `acli jira auth status`
- Check project key exists: `acli jira project list`
- Verify issue key format: `PROJECT-123`

### Issue: Token Not Found

**Cause**: `ATLASSIAN_API_TOKEN` environment variable not set

**Solution**:

```bash
# Check if token is loaded
echo $ATLASSIAN_API_TOKEN

# If empty, load from .env.user.config
export $(grep ATLASSIAN_API_TOKEN .env.user.config | xargs)

# Verify
echo $ATLASSIAN_API_TOKEN
```

### Issue: Command Not Found

**Cause**: `acli` not in PATH

**Solution**:

```bash
# Check if installed
which acli

# If not found, reinstall
brew reinstall acli

# Or add to PATH manually
export PATH="/usr/local/bin:$PATH"
```

### Issue: SSL/TLS Errors

**Cause**: Certificate issues or corporate proxy

**Solution**:

```bash
# Check if proxy is set
echo $HTTP_PROXY
echo $HTTPS_PROXY

# If behind corporate proxy, configure certificates
export SSL_CERT_FILE="/path/to/cert.pem"
export REQUESTS_CA_BUNDLE="/path/to/cert.pem"
```

### Issue: Slow Performance

**Cause**: Large result sets without pagination

**Solution**:

```bash
# Always use --limit or --paginate
acli jira workitem search --jql "project = TEAM" --limit 50

# Or paginate for all results
acli jira workitem search --jql "project = TEAM" --paginate
```

### Issue: CLI not found

**Cause**: CLI is not found in the directory

**Solution**: Share installation steps with the user provided in the references/setup.md file.

---

## Upgrade

### Check Current Version

```bash
acli --version
```

### Upgrade via Homebrew

```bash
brew upgrade acli
```

### Upgrade Manually

```bash
# Download latest version
curl -LO "https://acli.atlassian.com/darwin/latest/acli_darwin_arm64/acli"

# Make executable
chmod +x ./acli

# Replace existing
sudo mv ./acli /usr/local/bin/acli
```

---

## Uninstallation

### macOS (Homebrew)

```bash
brew uninstall acli
brew untap atlassian/homebrew-acli
```

### Manual Installation

```bash
sudo rm /usr/local/bin/acli
```

### Remove Configuration

```bash
# Remove authentication data
rm -rf ~/.config/acli

# Remove shell configuration
# Edit ~/.bashrc or ~/.zshrc and remove acli-related lines
```

---

## Getting Help

### Built-in Help

```bash
# General help
acli --help

# JIRA commands help
acli jira --help

# Specific command help
acli jira workitem search --help
```

### Documentation Links

- [Official Documentation](https://developer.atlassian.com/cloud/acli/)
- [Command Reference](commands.md)
- [JQL Examples](jql-examples.md)
- [Troubleshooting Guide](https://developer.atlassian.com/cloud/acli/guides/troubleshooting-guide/)

### Support Resources

- [Atlassian Community](https://community.atlassian.com/)
- [JIRA Support](https://support.atlassian.com/jira-software-cloud/)
- [API Token Management](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)

---

## Next Steps

After setup, you can:

1. **Explore commands**: See [Command Reference](commands.md)
2. **Learn JQL**: See [JQL Examples](jql-examples.md)
3. **Create aliases**: Add frequently used commands to your shell profile
4. **Integrate with scripts**: Use JSON output for automation

---

## Security Best Practices

### 1. Protect Your API Token

```bash
# Never commit tokens to git
echo ".env.user.config" >> .gitignore

# Use secure permissions
chmod 600 .env.user.config
```

### 2. Rotate Tokens Regularly

- Generate new tokens every 90 days
- Revoke unused tokens
- Use different tokens for different purposes

### 3. Use Read-Only Access

- This skill set is designed for read-only operations
- Request minimal necessary permissions
- Don't share tokens with write access

### 4. Monitor Usage

```bash
# Check active sessions
acli jira auth status

# Logout when done
acli jira auth logout
```

---

## Quick Reference Card

```bash
# Installation
brew tap atlassian/homebrew-acli && brew install acli

# Authentication
export $(grep ATLASSIAN_API_TOKEN .env.user.config | xargs)
export $(grep ATLASSIAN_USER .env.user.config | xargs)
echo $ATLASSIAN_API_TOKEN | acli jira auth login \
  --site "sessionm.atlassian.net" \
  --email "$ATLASSIAN_USER" \
  --token

# Verification
acli jira auth status

# Common commands
acli jira workitem view KEY-123
acli jira workitem search --jql "assignee = currentUser()"
acli jira project list --recent

# Get remote links (Confluence) via REST API
curl -u "$ATLASSIAN_USER:$ATLASSIAN_API_TOKEN" \
  "https://sessionm.atlassian.net/rest/api/3/issue/KEY-123/remotelink" | jq
```

---

**Ready to use Atlassian CLI? Start with the [SKILL.md](../SKILL.md) guide!**
