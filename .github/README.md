# .github Directory - Copilot & Agent System Guide

This directory contains configuration files for GitHub Copilot's agent system, including agents, instructions, prompts, and skills that enhance AI-assisted development in this repository.

## Table of Contents

- [Overview](#overview)
- [Subagent Architecture](#subagent-architecture)
- [Directory Structure](#directory-structure)
- [How to Use](#how-to-use)
  - [Agents](#agents)
  - [Instructions](#instructions)
  - [Prompts](#prompts)
  - [Skills](#skills)
- [Available Agents](#available-agents)
- [Available Skills](#available-skills)
- [VS Code Setup](#vs-code-setup)
- [Best Practices](#best-practices)

---

## Overview

The `.github` directory leverages GitHub Copilot's extensibility features to provide:

- **Agents**: Autonomous AI workflows that solve complex multi-step tasks
- **Instructions**: Context-specific coding guidelines and rules
- **Prompts**: Reusable prompt templates for common tasks
- **Skills**: External tool integrations (CLI tools, APIs, scripts)

---

## Directory Structure

```
.github/
├── agents/                                      # AI agent definitions
│   ├── 4.1-Beast.agent.md                      # Claude Sonnet 4 Beast Mode
│   ├── Thinking-Beast-Mode.agent.md            # Extended thinking agent
│   ├── internal-jira-context-worker.agent.md   # Internal Jira/Confluence context worker
│   ├── internal-repo-coverage-worker.agent.md  # Internal repository evidence worker
│   ├── internal-swagger-map-worker.agent.md    # Internal OpenAPI mapping worker
│   ├── internal-report-synth-worker.agent.md   # Internal report synthesis worker
│   ├── beta-analyze-release-bugs-v1.agent.md   # Release bug analysis
│   ├── beta-analyze-test-coverage-v0.agent.md  # Test coverage analysis v0
│   ├── beta-analyze-test-coverage-v2.agent.md  # Test coverage analysis v2
│   ├── beta-api-coverage-checker.agent.md      # API coverage checker
│   ├── beta-functionality-coverage-analyzer.agent.md  # Functionality coverage
│   ├── beta-migrate-postman-v0.agent.md        # Postman migration v0
│   ├── beta-migrate-postman-v1.agent.md        # Postman migration v1
│   ├── beta-peeves-v1.agent.md                 # Test automation v1
│   ├── beta-peeves-v2.agent.md                 # Test automation v2
│   ├── beta-testcases-creation-e2e.agent.md    # E2E test case creation
│   ├── beta-testcases-creation-int.agent.md    # Integration test case creation
│   ├── beta-testcases-creation-v0.agent.md     # Test case creation v0
│   ├── beta-testcases-creation-v2.agent.md     # Test case creation v2
│   └── beta-testcases-creation-v3.agent.md     # Test case creation v3
├── instructions/                                # Coding guidelines and rules
│   ├── agent-skills.instructions.md            # Agent skill creation guide
│   ├── agents.instructions.md                  # Custom agent creation guide
│   ├── github-actions-ci-cd-best-practices.instructions.md  # CI/CD guidelines
│   ├── jest-openapi.test.md                    # Jest + OpenAPI test patterns
│   ├── jest.test.md                            # Jest testing guidelines
│   ├── prompt.instructions.md                  # Prompt creation guide
│   ├── sql-sp-generation.instructions.md       # SQL/stored procedure guide
│   ├── test-creation.instructions.md           # Test creation guidelines
│   └── typescript-5-es2022.instructions.md     # TypeScript 5.x standards
├── prompts/                                     # Reusable prompt templates
│   ├── ai-prompt-engineering-safety-review.prompt.md  # Safety review
│   ├── breakdown-test.prompt.md                # Test breakdown template
│   └── javascript-typescript-jest.prompt.md    # Jest test template
├── skills/                                      # External tool integrations
│   ├── api-coverage-checker/                   # API coverage analysis skill
│   │   ├── SKILL.md                           # Skill definition
│   │   ├── FILE_INDEX.md                      # File index
│   │   ├── README.md                          # Skill documentation
│   │   ├── references/                        # Reference materials
│   │   └── scripts/                           # Utility scripts
│   ├── atlassian-cli/                          # JIRA/Confluence CLI skill
│   │   ├── SKILL.md                           # Skill definition
│   │   ├── references/                        # API docs, JQL examples
│   │   └── scripts/                           # CLI automation scripts
│   ├── glab-cli/                               # GitLab CLI skill
│   │   ├── SKILL.md                           # Skill definition
│   │   ├── references/                        # GitLab API docs
│   │   └── scripts/                           # Pipeline/job scripts
│   ├── make-skill-template/                    # Skill template generator
│   │   └── SKILL.md                           # Template skill
│   ├── test-coverage-analyzer/                 # Test coverage analysis skill
│   │   └── SKILL.md                           # Skill definition
│   └── testrail/                               # TestRail integration skill
│       ├── SKILL.md                           # Skill definition
│       ├── references/                        # TestRail API docs
│       └── scripts/                           # TestRail automation
└── README.md                                    # This file
```

---

## Subagent Architecture

This repository uses a coordinator/worker pattern for complex agent workflows in VS Code.

- **Coordinator agents (user-facing):** selected in chat and responsible for end-to-end orchestration and final output.
- **Worker agents (internal):** invoked as subagents for focused subtasks (context extraction, evidence scan, synthesis).

### Invocation Controls

- Worker agents are configured with `user-invokable: false` to keep the chat picker clean.
- Coordinator agents use `agents: [...]` allowlists to restrict delegation to approved workers.
- `infer` is deprecated; use `user-invokable` and `disable-model-invocation` for invocation control.

### Why this pattern

- Keeps main chat context focused and smaller
- Reduces accidental use of unintended agents
- Enables parallel, independent analysis where appropriate
- Produces more deterministic outputs for coverage and reporting tasks

---

## How this fits in the Project

The `.github/` directory configures Copilot's agent system for the entire repository. For the main project structure, see the root-level [AGENTS.md](../AGENTS.md) and the workspace folders:

```
AGENTS.md
API-TEST-MVP.md
babel.config.cjs
CODEOWNERS
eslint.config.js
jest.config.ts
package.json
README.md
tsconfig.json
docs/
envs/
lib/
reports/
scripts/
src/
tests/
tests-ai/
tests-client/
tmp/
```

See [AGENTS.md](../AGENTS.md) for a full breakdown of each folder and file in the main project.

---

---

## How to Use

### Agents

**What are agents?**  
Agents are autonomous AI workflows that iterate until a complex task is fully resolved. They combine research, planning, execution, and validation.

**How to use:**

1. Open GitHub Copilot Chat in VS Code (`Cmd+Shift+I` on macOS or `Ctrl+Alt+I` on Windows)
2. Type `@` and select an agent (e.g., `@peeves.agent`) or under "Agent" dropdown select agent to use.
3. Provide your request (e.g., "Generate test cases for MLP-12345")
4. The agent will autonomously:
   - Fetch information from URLs/APIs
   - Analyze existing code
   - Generate/modify files
   - Run tests and iterate on errors
   - Continue until task is complete

**Example:**

```
@peeves.agent Generate integration tests for the Offers API based on MLP-12345
```

**Agent features:**

- Autonomous iteration (doesn't stop until complete)
- Web research via `fetch_webpage`
- Integration with JIRA, TestRail, GitLab
- Automatic test execution and error correction (up to 10 iterations)
- Resume capability: Type "resume" or "continue" to restart

---

### Instructions

**What are instructions?**  
Instructions are rules that apply automatically to specific file types, ensuring consistent coding standards.

**How they work:**

- Automatically loaded when editing matching files
- Defined in frontmatter: `applyTo: '**/*.ts, **/*.test.ts'`
- Provide context-aware guidance without manual invocation

**Current instructions:**

- **`jest-openapi.instructions.md`**: Guidelines for writing TypeScript Jest tests with OpenAPI
  - Applies to: `**/*.ts`, `**/*.js`, `**/*.test.ts`, `**/*.spec.ts`
  - Enforces ES6 modules, async/await, OpenAPI client patterns
  - Defines project structure and test organization

**Example auto-application:**
When you open any `.test.ts` file, Copilot automatically knows:

- Use `src/clients/` for API requests (not `lib/`)
- Follow ES6 import/export patterns
- Use `async/await` instead of `.then()`
- Organize tests by domain/Swagger structure

---

### Prompts

**What are prompts?**  
Prompts are reusable templates for common coding tasks, providing consistent structure and best practices.

**How to use:**

1. Open Copilot Chat
2. Type `/prompt` or reference the prompt file
3. Copilot applies the template to your request

**Current prompts:**

- **`peeves_test_v1.prompt.md`**: Jest testing patterns
  - Test file naming conventions (`.test.ts`)
  - Describe/it block organization
  - Common Jest matchers
  - HTTP request patterns (no mocking, use Axios)

**Example:**

```
Use the peeves_test_v1 prompt to create a test suite for the transaction service
```

---

### Skills

**What are skills?**  
Skills extend Copilot with external CLI tools, APIs, and scripts, enabling agents to interact with third-party systems.

**How they work:**

- Defined with metadata in `SKILL.md` files
- Auto-detected when agents need to interact with specific services
- Include authentication setup, command patterns, and examples

**Activation:**
Skills automatically activate when:

- User mentions specific URLs (e.g., `sessionm.atlassian.net`)
- Agent needs to fetch external data
- Specific keywords are detected in requests

---

## Available Agents

### Core Agents

#### 1. **4.1-Beast.agent.md** - Claude Sonnet 4 Beast Mode

- **Purpose**: High-performance autonomous coding agent
- **Model**: Claude Sonnet 4
- **Key features**:
  - Extended context window for complex tasks
  - Extensive web research via `fetch_webpage`
  - Sequential thinking for multi-step problems
- **Use cases**: Complex refactoring, large feature implementation

#### 2. **Thinking-Beast-Mode.agent.md** - Extended Thinking Agent

- **Purpose**: Deep analytical problem-solving with extended reasoning
- **Model**: Claude Sonnet 4 with extended thinking
- **Key features**:
  - Extra time for analytical reasoning before responses
  - Ideal for complex architectural decisions
  - Iterative approach to solving ambiguous problems
- **Use cases**: System design, complex debugging, architectural planning

### Test Automation Agents

#### 3. **beta-peeves-v1.agent.md / v2.agent.md** - Peeves Test Automation

- **Purpose**: Specialized agents for Peeves test automation framework
- **Model**: Claude Sonnet 4 / 4.5
- **Key features**:
  - Direct access to `sessionm.atlassian.net` and `sessionm.testrail.com`
  - Automatic test execution and iteration (up to 10 attempts)
  - Environment-aware (requires `TESTRAIL_CONFIG` on first run)
  - Asks permission before running tests
- **Use cases**: Integration test generation, E2E test creation, automation workflows

#### 4. **beta-testcases-creation-[e2e|int|v0|v2|v3].agent.md** - Test Case Generation

- **Purpose**: Generate test cases from JIRA tickets, documentation, and existing tests
- **Model**: Claude Sonnet 4.5
- **Key features**:
  - JIRA ticket analysis for AC extraction
  - Local documentation and swagger research
  - Iterative test case refinement
  - Specialized versions for E2E vs integration tests
- **Use cases**: Test planning, test case documentation, TestRail case creation

### Analysis & Coverage Agents

#### 5. **beta-analyze-test-coverage-[v0|v2].agent.md** - Test Coverage Analysis

- **Purpose**: Identify test coverage gaps for specific functionality or JIRA tickets
- **Model**: Claude Sonnet 4.5
- **Key features**:
  - JIRA query integration
  - TestRail coverage correlation
  - Generates comprehensive coverage reports
  - Analyzes integration and E2E test coverage separately
- **Use cases**: Coverage audits, test gap analysis, sprint planning

#### 6. **beta-api-coverage-checker.agent.md** - API Coverage Checker

- **Purpose**: Compare OpenAPI/Swagger documentation with integration tests
- **Model**: Claude Sonnet 4.5
- **Key features**:
  - Analyzes swagger files vs test implementations
  - Field-level coverage analysis
  - Identifies untested endpoints and parameters
  - Domain filtering (catalog/incentives/offers/transactions)
- **Use cases**: API test coverage audits, endpoint gap analysis

#### 7. **beta-functionality-coverage-analyzer.agent.md** - Functionality Coverage

- **Purpose**: Analyze test coverage for specific features across domains
- **Model**: Claude Sonnet 4.5
- **Use cases**: Feature testing analysis, cross-domain coverage verification

#### 8. **beta-analyze-release-bugs-v1.agent.md** - Release Bug Analysis

- **Purpose**: Analyze bugs from releases to identify patterns and gaps
- **Model**: Claude Sonnet 4.5
- **Key features**:
  - JIRA issue analysis
  - Pattern detection in bug reports
  - Coverage gap recommendations
- **Use cases**: Post-release analysis, QA process improvement

### Migration Agents

#### 9. **beta-migrate-postman-[v0|v1].agent.md** - Postman Collection Migration

- **Purpose**: Migrate Postman collections to OpenAPI-based Jest tests
- **Model**: Claude Sonnet 4.5
- **Key features**:
  - Postman collection parsing
  - OpenAPI factory mapping
  - Jest test generation with proper structure
- **Use cases**: Test modernization, Postman to Jest migrations

---

## Available Skills

### 1. **api-coverage-checker** - API Test Coverage Analysis

- **Purpose**: Compare OpenAPI/Swagger documentation with integration tests
- **Capabilities**:
  - Parse swagger files for API endpoints and schemas
  - Analyze integration test files for coverage
  - Identify untested endpoints and request/response fields
  - Generate detailed coverage reports by domain
  - Field-level analysis for request payloads and responses
- **Domains**: catalog, incentives, offers, transactions, cloudpos, composer
- **Output**: Markdown reports with coverage percentages and gap details

**Example usage:**

```
Check API coverage for offers domain version 2.0
Analyze catalog API test coverage and identify gaps
```

### 2. **test-coverage-analyzer** - Functionality Test Coverage

- **Purpose**: Analyze test coverage for specific features or functionality
- **Capabilities**:
  - Examine integration tests by domain
  - Examine E2E tests by trigger type
  - Identify test patterns and coverage gaps
  - Generate actionable coverage reports
- **Test Types**: Integration (`tests/integration`), E2E (`tests/triggers`, `tests/e2e`)
- **Output**: Detailed coverage analysis with recommendations

**Example usage:**

```
Analyze test coverage for offer redemption functionality
What's the coverage for points earning features?
```

### 3. **testrail** - TestRail API Integration

- **Service**: `sessionm.testrail.com`
- **Capabilities**:
  - Convert TestRail URLs to API endpoints
  - Fetch test cases, runs, suites, projects
  - Sync test results
  - Coverage analysis
- **URL patterns**: `/cases/view/12345`, `/runs/view/789`
- **Authentication**: Requires `TESTRAIL_URL`, `TESTRAIL_USER`, `TESTRAIL_API_KEY`

**Example usage:**

```bash
# URL to API conversion
scripts/url-to-testrail.sh "https://sessionm.testrail.com/index.php?/cases/view/12345"
# Output: GET /api/v2/get_case/12345
```

### 4. **atlassian-cli** - JIRA/Confluence CLI

- **Service**: `sessionm.atlassian.net`
- **Capabilities**:
  - Read JIRA tickets, comments, attachments
  - Search and filter issues
  - View project/board/sprint info
  - Access Confluence pages (read-only)
- **Tool**: `acli` CLI
- **Authentication**: Uses `ATLASSIAN_API_TOKEN` and `ATLASSIAN_USER` from `.env.user.config`

**Installation:**

```bash
brew tap atlassian/homebrew-acli
brew install acli
```

**Configuration:**

```bash
acli jira auth login --web
```

### 5. **glab-cli** - GitLab CLI Integration

- **Service**: `gitlab.sessionm.com`
- **Capabilities**:
  - View merge requests
  - Download CI/CD job logs
  - Check pipeline status
  - API access to GitLab resources
- **URL patterns**: `/merge_requests/13354`, `/pipelines/1421206`, `/jobs/11610206`
- **Tool**: `glab` CLI

**Installation:**

```bash
brew install glab
glab config set host gitlab.sessionm.com -g
```

### 6. **make-skill-template** - Skill Template Generator

- **Purpose**: Create new Agent Skills from prompts or templates
- **Capabilities**:
  - Generate SKILL.md files with proper frontmatter
  - Create directory structure (scripts/, references/, assets/)
  - Scaffold skills from descriptions or by duplicating template
- **Use cases**: Building new integrations, custom tool wrappers

**Example usage:**

```
Create a new skill for AWS CLI integration
Make a skill template for database query tool
```

---

## VS Code Setup

### 1. **Install Required Extensions**

- **GitHub Copilot** (required)
- **GitHub Copilot Chat** (required)

### 2. **Verify Installation**

```bash
# In VS Code terminal
code --list-extensions | grep -i copilot
```

Expected output:

```
github.copilot
github.copilot-chat
```

### 3. **Enable Agents**

1. Open VS Code Settings (`Cmd+,` on macOS)
2. Search for "Copilot Agent"
3. Ensure **"GitHub Copilot: Enable Agent"** is checked

### 4. **Enable Experimental Features**

1. Enable usage of Agent Skills > Chat: Use Agent Skills (@feature:chat)
2. Enable usage of Subagent > Chat › Custom Agent In Subagent: Enabled
3. Enable usage of Nested Agents Md Files > Chat: Use Nested Agents Md Files

### 5. **Environment Configuration**

Create/update `.env.user.config` with required credentials:

```bash
# TestRail
TESTRAIL_URL=https://sessionm.testrail.com
TESTRAIL_USER=your.email@example.com
TESTRAIL_API_KEY=your-api-key

# Atlassian (JIRA/Confluence)
ATLASSIAN_API_TOKEN=your-atlassian-token
ATLASSIAN_USER=your.email@example.com
```

### 6. **Optional CLI Tools**

Install skills-related CLI tools:

```bash
# Atlassian CLI
brew tap atlassian/homebrew-acli
brew install acli

# GitLab CLI
brew install glab
glab config set host gitlab.sessionm.com -g
```

### 7. **Test the Setup**

1. Open Copilot Chat (`Cmd+Shift+I`)
2. Type `@` - you should see available agents
3. Test an agent:
   ```
   @default.agent What agents are available?
   ```

---

## Best Practices

### Agent Usage

- **Be specific**: Provide JIRA tickets, URLs, or file paths in your request
- **Let them iterate**: Agents are autonomous - let them complete before intervening
- **Use "resume"**: If interrupted, type "resume" to continue
- **First test run**: Provide environment name (e.g., `qa190.q`) when agent first runs tests

### Instruction Files

- Keep instructions focused and actionable
- Use `applyTo` frontmatter to target specific file types
- Update instructions when project patterns change
- Reference instructions in PRs when enforcing new standards

### Skills

- Install CLI tools before using related agents
- Verify authentication before running skills
- Skills are read-only - they won't modify JIRA/TestRail/GitLab

### General Tips

- Combine agents with skills for powerful workflows
- Use semantic file naming for auto-detection
- Keep `.env.user.config` out of version control
- Review agent-generated code before committing

---

## Troubleshooting

### Agent not appearing in Copilot Chat

- Verify `.agent.md` files have valid frontmatter
- Restart VS Code
- Check Copilot extension is enabled

### Skills not activating

- Verify CLI tools are installed (`which acli`, `which glab`)
- Check environment variables are set
- Ensure URLs match skill patterns (e.g., `sessionm.atlassian.net`)

### Tests failing with environment errors

- Set `TESTRAIL_CONFIG` environment variable:
  ```bash
  export TESTRAIL_CONFIG="qa190.q"
  ```
- Check `.env.user.config` exists and has correct values

### Agent stops prematurely

- Type "resume" or "continue" to restart
- Check if agent is waiting for permission (first test run)
- Review errors in Copilot Chat output

---

## Contributing

When adding new agents, instructions, prompts, or skills:

1. Follow existing file naming conventions
2. Include complete frontmatter metadata
3. Add documentation to this README
4. Test thoroughly before committing
5. Update examples if patterns change

---

## Agent Tokens Limitations

- Free requests are the unlimited.
- Premium requests are limited to 300 per month.
- Premium usage is measured per request—not by tokens. Each interaction with advanced model counts against your monthly quota.
- You can check your token consumption by mouse over on the Copilot Usage icon (bottom right corner).
- Use the free Agents for general tasks and Premium to run the final version.

---

## Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [VS Code Copilot Chat](https://code.visualstudio.com/docs/copilot/copilot-chat)
- [AI Model Comparison](https://docs.github.com/en/copilot/reference/ai-models/model-comparison)
- [SWE-bench](https://www.swebench.com/)
- [Awesome GitHub Copilot Page](https://github.github.com/awesome-copilot/)
- [Awesome GitHub Copilot](https://github.com/github/awesome-copilot)
- [Context7 Page](https://context7.com/)
- [Context7](https://github.com/upstash/context7)
- [AGENTS.md](https://agents.md/)
- [MC GitHub Copilot for Business](https://stage.developer.mastercard.com/internal/generative-ai-code-assistant/documentation)
- [MC Teams channel for general support](https://teams.microsoft.com/l/channel/19%3Af8c48d1fd6a74241ae3d25281e9297ad%40thread.tacv2/Developer%20Onboarding%20Support?groupId=97733c68-739d-4a7d-ac4a-38c32dcbb0db&tenantId=f06fa858-824b-4a85-aacb-f372cfdc282e)
- Project-specific docs: See individual `SKILL.md` files in `skills/` subdirectories

---

**Last Updated**: February 16, 2026
