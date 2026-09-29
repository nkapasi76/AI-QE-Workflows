# AI-QE-Workflows

An end-to-end test automation framework built on [Playwright](https://playwright.dev/). Tests are written in **JavaScript and TypeScript**, and the project includes:
- the **Page Object Model** (POM);
- custom fixtures and data-driven tests;
- API-assisted UI tests;
- **Cucumber BDD**;
- Allure reporting;
- runs on **Azure Playwright Workspaces**.

The repo also includes **GitHub Copilot agents**. They turn requirements (a BRD and design docs, or a Jira epic) into a comprehensive E2E test plan and Gherkin test cases, ready to import into TestRail.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Page Object Model](#page-object-model)
  - [JavaScript](#javascript-page-objects)
  - [TypeScript](#typescript-page-objects)
  - [Custom Fixtures and Test Data](#custom-fixtures-and-test-data)
  - [API Utilities](#api-utilities)
- [Cucumber BDD](#cucumber-bdd)
- [AI Agents for E2E Test Case Creation](#ai-agents-for-e2e-test-case-creation)
  - [Available Agents](#available-agents)
  - [One-time Setup](#one-time-setup)
  - [Workflow 1: From Local Documents (no credentials)](#workflow-1-from-local-documents-no-credentials)
  - [Workflow 2: From Jira, into TestRail and Jira](#workflow-2-from-jira-into-testrail-and-jira)
  - [Output Formats](#output-formats)
  - [From Test Plan to Automated Tests](#from-test-plan-to-automated-tests)
  - [AI First-Pass Code Review](#ai-first-pass-code-review)
  - [Release Certification Bug Analysis](#release-certification-bug-analysis)
- [Copilot Skills](#copilot-skills)
- [CI/CD](#cicd)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

---

## Tech Stack

| Area              | Tooling                                                              |
| ----------------- | -------------------------------------------------------------------- |
| Test runner       | `@playwright/test` 1.63                                              |
| Languages         | JavaScript (CommonJS) and TypeScript (transpiled by Playwright; no build step) |
| BDD               | `@cucumber/cucumber`                                                 |
| Reporting         | Playwright HTML reporter, `allure-playwright`, Cucumber HTML report  |
| Cloud execution   | `@azure/playwright` + `@azure/identity` (Azure Playwright Workspaces) |
| AI assistance     | GitHub Copilot custom agents, skills, and MCP servers (`.github/`, `.vscode/mcp.json`) |

---

## Project Structure

```
Playwright_Automation/
├── tests/                      # Playwright specs (*.spec.js and *.spec.ts)
│   ├── greenkart-shopping/     #   specs generated from spec/greenkart-test-plan.md
│   └── seed.spec.ts            #   seed test used by the Playwright agents
├── pageobjects/                # Page objects: JavaScript
├── pageobjects_ts/             # Page objects: TypeScript
├── utils/                      # JS fixtures, API helpers, JSON test data
├── utils_ts/                   # TS fixtures and API helpers
├── feature/                    # Cucumber BDD
│   ├── *.feature
│   ├── step_definitions/steps.js
│   └── support/hooks.js
├── spec/                       # Playwright agent test plans (e.g. greenkart-test-plan.md)
├── docs/input/                 # Source documents (BRD, design docs) for the E2E agents
├── reports/                    # E2E agent output: test plans, Gherkin JSON, TestRail payloads
├── playwright.config.js        # Local Playwright configuration
├── playwright.service.config.js# Azure Playwright Workspaces configuration
├── .vscode/mcp.json            # MCP servers: Playwright test server, Playwright MCP, Atlassian
└── .github/
    ├── agents/                 # Copilot custom agents (*.agent.md)
    ├── templates/e2e-test-plan/# Test plan template + Gherkin style guide used by the E2E agents
    ├── skills/                 # Copilot skills: testrail, atlassian-cli, glab-cli, ...
    ├── insructions/            # Copilot instruction files
    ├── prompts/                # Reusable prompt files
    └── workflows/              # GitHub Actions
```

---

## Getting Started

**Prerequisites:** Node.js LTS, npm, and VS Code with GitHub Copilot Chat (for the agents).

```bash
git clone https://github.com/nkapasi76/AI-QE-Workflows.git
cd AI-QE-Workflows
npm ci
npx playwright install --with-deps
```

---

## Running Tests

| Command                        | What it runs                                                     |
| ------------------------------ | ---------------------------------------------------------------- |
| `npm run regression`           | All Playwright specs, headed                                     |
| `npm test`                     | `tests/WebAPIPart2.spec.js`, headed                              |
| `npm run webtests`             | Tests with `@web` in their title. `--grep` is case-insensitive, so `@Web`, `@Webs` and `@Webst` tests run too. |
| `npm run allureReports`        | `@web` tests with the line and Allure reporters                  |
| `npm run firefox`              | All Playwright specs in Firefox (`--browser=firefox`)            |
| `npm run test:cucumber`        | Cucumber feature files in `feature/`                             |

**Default settings** (`playwright.config.js`):

| Setting | Locally | When `CI` is set |
| ------- | ------- | ---------------- |
| Specs run | `tests/**/*.spec.js` and `tests/**/*.spec.ts` | same |
| Browser | Chromium, headed | Chromium, headless |
| HTML report | Opens after every run | Written to `playwright-report/`, not opened |
| Retries | 1 | 1 |
| Evidence | Trace always; screenshot and video on failure | same |
| Timeouts | 30 s per test, 5 s per `expect` | same |

To run headless locally, use `CI=1 npx playwright test`.

Useful direct commands:

```bash
npx playwright test tests/ClientAppPO.spec.js           # one JavaScript spec
npx playwright test tests/ClientAppPO.spec.ts           # one TypeScript spec
npx playwright test --grep "@Web "                      # by tag (case-insensitive regex; trailing space excludes @Webs/@Webst)
npx playwright test --headed --debug                    # step through with the Inspector
npx playwright test --list                              # list discovered tests
npx playwright show-report                              # open the last HTML report
```

`npm run allureReports` writes raw results to `allure-results/`. To view them as a report, install the Allure command-line tool (e.g. `npm i -D allure-commandline`), then run `npx allure generate allure-results --clean && npx allure open`.

**Run on Azure Playwright Workspaces:** `playwright.service.config.js` builds on the local config. Sign in with the Azure CLI, and set `PLAYWRIGHT_SERVICE_URL` to your workspace's service endpoint (from the Azure portal). Without that variable, the config stops with *"The value for the PLAYWRIGHT_SERVICE_URL variable is not set correctly"*.

```bash
az login
export PLAYWRIGHT_SERVICE_URL="<your workspace service URL>"
npx playwright test --config=playwright.service.config.js --workers=20
```

---

## Page Object Model

Each page's locators and actions live in a page class. A `POManager` creates every page object for a given Playwright `page`, so tests get them from a single entry point, with no locators inside the tests.

```
Test (spec) ──► POManager(page) ──► LoginPage / DashboardPage / CartPage / OrdersReviewPage / OrdersHistoryPage
```

### JavaScript Page Objects

**Page class:** `pageobjects/LoginPage.js`

```js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.signInButton = page.locator("[value='Login']");
    this.emailField = page.locator('#userEmail');
    this.passwordField = page.locator('#userPassword');
  }

  goTo() {
    return this.page.goto('https://rahulshettyacademy.com/client');
  }

  async validLogin(username, password) {
    await this.emailField.fill(username);
    await this.passwordField.fill(password);
    await this.signInButton.click();
  }
}
module.exports = { LoginPage };
```

**Manager:** `pageobjects/POManager.js` (abridged)

```js
const { LoginPage } = require('./LoginPage');
const { CartPage } = require('./CartPage');
// ...other pages

class POManager {
  constructor(page) {
    this.page = page;
    this.loginPage = new LoginPage(page);
    this.cartPage = new CartPage(page);
    // ...
  }
  getLoginPage() { return this.loginPage; }
  getCartPage() { return this.cartPage; }
  // ...
}
module.exports = { POManager };
```

**Data-driven spec:** `tests/ClientAppPO.spec.js` (simplified)

```js
const { test, expect } = require('@playwright/test');
const { POManager } = require('../pageobjects/POManager');
const dataset = require('../utils/placeorderTestData.json');

for (const data of dataset) {
  test(`@Webs Client App login for ${data.productName}`, async ({ page }) => {
    const poManager = new POManager(page);

    const loginPage = poManager.getLoginPage();
    await loginPage.goTo();
    await loginPage.validLogin(data.username, data.password);

    const dashboardPage = poManager.getDashboardPage();
    await dashboardPage.searchProductAddCart(data.productName);
    await dashboardPage.navigateToCart();

    const cartPage = poManager.getCartPage();
    await cartPage.VerifyProductIsDisplayed(data.productName);
    await cartPage.Checkout();

    const ordersReviewPage = poManager.getOrdersReviewPage();
    await ordersReviewPage.searchCountryAndSelect('ind', 'India');
    const orderId = await ordersReviewPage.SubmitAndGetOrderId();

    await dashboardPage.navigateToOrders();
    const ordersHistoryPage = poManager.getOrdersHistoryPage();
    await ordersHistoryPage.searchOrderAndSelect(orderId);
    expect(orderId.includes(await ordersHistoryPage.getOrderId())).toBeTruthy();
  });
}
```

### TypeScript Page Objects

The TypeScript page objects in `pageobjects_ts/` mirror the JavaScript ones, with typed `Page` and `Locator` members.

**Page class:** `pageobjects_ts/LoginPage.ts`

```ts
import { Locator, Page } from '@playwright/test';

export class LoginPage {
  page: Page;
  signInButton: Locator;
  emailField: Locator;
  passwordField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signInButton = page.locator("[value='Login']");
    this.emailField = page.locator('#userEmail');
    this.passwordField = page.locator('#userPassword');
  }

  goTo() {
    return this.page.goto('https://rahulshettyacademy.com/client');
  }

  async validLogin(username: string, password: string) {
    await this.emailField.fill(username);
    await this.passwordField.fill(password);
    await this.signInButton.click();
  }
}
```

**Spec using a typed fixture:** `tests/ClientAppPO.spec.ts` (simplified)

```ts
import { expect } from '@playwright/test';
import { customtest1 } from '../utils_ts/test-base.ts';
import { POManager } from '../pageobjects_ts/POManager.ts';

customtest1('Client App login', async ({ page, testDataForOrder }) => {
  const poManager = new POManager(page);

  const loginPage = poManager.getLoginPage();
  await loginPage.goTo();
  await loginPage.validLogin(testDataForOrder.username, testDataForOrder.password);

  const dashboardPage = poManager.getDashboardPage();
  await dashboardPage.searchProductAddCart(testDataForOrder.productName);
  await dashboardPage.navigateToCart();

  const cartPage = poManager.getCartPage();
  await cartPage.VerifyProductIsDisplayed(testDataForOrder.productName);
  await cartPage.Checkout();
});
```

### Custom Fixtures and Test Data

Fixtures inject test data (or ready-made objects) into tests through `test.extend`.

**JavaScript** (`utils/test-base.js`):

```js
const base = require('@playwright/test');

exports.customtest1 = base.test.extend({
  testDataForOrder: { username: '<user>', password: '<password>', productName: 'ADIDAS ORIGINAL' },
});
```

**TypeScript** (`utils_ts/test-base.ts`), with a typed fixture:

```ts
import { test as baseTest } from '@playwright/test';

interface TestDataForOrder { username: string; password: string; productName: string; }

export const customtest1 = baseTest.extend<{ testDataForOrder: TestDataForOrder }>({
  testDataForOrder: { username: '<user>', password: '<password>', productName: 'ADIDAS ORIGINAL' },
});
```

Data sets for data-driven tests live in JSON files such as `utils/placeorderTestData.json` and `utils/externalData.json`. Each object in the array produces one test.

### API Utilities

`utils/APiUtils.js` (and `utils_ts/APiUtils.ts`) use Playwright's `request` context to log in and create orders through the API. UI tests can then start from a known state, skipping slow UI setup steps:

```js
const { request } = require('@playwright/test');
const { APiUtils } = require('../utils/APiUtils');

test.beforeAll(async () => {
  const apiContext = await request.newContext();
  const apiUtils = new APiUtils(apiContext, loginPayload);
  response = await apiUtils.createOrder(orderPayload); // { token, orderId }
});
```

See `tests/WebAPIPart1.spec.js`, `tests/WebAPIPart2.spec.js`, and `tests/NetworkTest*.spec.js` for token injection, storage state reuse, and network interception examples.

---

## Cucumber BDD

Feature files in `feature/` reuse the same page objects through `POManager`:

- `feature/support/hooks.js` launches a browser and creates `this.poManager` before each scenario.
- `feature/step_definitions/steps.js` maps each Gherkin step to page object calls.

```gherkin
Feature: Ecommerce Validation
  @Regression
  Scenario: Placing an order
    Given when a successful login to the Ecommerce application with "<email>" and "<password>"
    When  Add "iphone 13 pro" to Cart
    Then verify "iphone 13 pro" is displayed in the cart
```

```bash
npm run test:cucumber                 # runs feature/**/*.feature (headed)
npm run test:cucumber -- --dry-run    # check every step has a step definition, without opening a browser
```

---

## AI Agents for E2E Test Case Creation

The agents run in **VS Code GitHub Copilot Chat**. They read requirements and write a **comprehensive E2E test plan** with **Gherkin test cases**. They also produce **TestRail `add_case` payloads**, and can create **Jira tickets** once a human has approved the tests.

### Available Agents

| Agent (name in the Copilot agent picker) | File | Use it for |
| --- | --- | --- |
| **Test Cases Creation - E2E Test Creator v3 (Docs)** | `e2e-agentic-flow-requirements-gherkin-style-testscenarios.agent.md` | Creating the test plan and tests from **local BRD and design documents**. No Jira or TestRail access is needed. |
| **Test Cases Creation - E2E Test Creator v3 (Jira + TestRail)** | `e2e-agentic-flow-jira-testrail-gherkin-style-testscenarios.agent.md` | Creating tests from a **Jira Epic/Feature**, importing approved tests into **TestRail**, and creating linked **Jira tickets** |
| **playwright-test-planner** | `playwright-test-planner.agent.md` | Exploring a live web app and writing a test plan in `spec/` |
| **playwright-test-generator** | `playwright-test-generator.agent.md` | Turning test plan items into Playwright specs in `tests/` |
| **playwright-test-healer** | `playwright-test-healer.agent.md` | Debugging and fixing failing Playwright tests |
| **Playwright Code Review Agent (First Pass)** | `playwright-code-review.agent.md` | First look at a GitHub PR or local branch. A human confirms the findings, and the agent then requests a human reviewer to complete the review. |
| **Release Certification Bug Analyzer** | `release-bug-analyzer.agent.md` | Categorizing release certification tickets from Jira (read-only). A human reviews the categories, then the agent reports patterns and coverage gaps for QA leadership. |
| **Thinking Beast Mode** | `Thinking-Beast-Mode.agent.md` | General autonomous coding |

The E2E Test Creator agents coordinate three internal workers. These don't appear in the picker:
- **Internal Jira Context Worker:** requirements from Jira and Confluence, or from local documents.
- **Internal Repo Coverage Worker:** existing specs, `.feature` files, and page objects in this repo.
- **Internal Report Synth Worker:** drafts test plan sections 1–2.

```
Sources (BRD / design docs / Jira)
        │
        ▼
 Phase 0–2  Validate inputs, extract requirements, scan the repo   (workers run in parallel)
        │
        ▼
 Phase 3    Write the test plan + Gherkin tests                    reports/<RUN-KEY>/test-plan-<RUN-KEY>.md
        │
        ▼
 Phase 4    ⏸ HUMAN REVIEW: approve / reject / edit each test
        │
        ▼
 Phase 5    Write the Gherkin JSON + TestRail payloads, and validate them
        │
        ├── Docs agent: stops and hands over the import commands
        │
        ▼  (Jira + TestRail agent only)
 Phase 5d   ⏸ Confirm, then import into TestRail
 Phase 6–7  ⏸ Confirm, then create Jira tickets linked to the epic
```

### One-time Setup

1. **VS Code + Copilot:** install GitHub Copilot and Copilot Chat. In Settings, enable:
   - `Chat: Use Agent Skills`
   - `Chat › Custom Agent In Subagent: Enabled`
2. **`jq`** (used for validation): `brew install jq`
3. **Jira + TestRail agent only:**
   - **Atlassian MCP server:** it's already configured in `.vscode/mcp.json` (`https://mcp.atlassian.com/v2/mcp`). Open that file, click **Start** above `atlassian`, and sign in to Atlassian in the browser. Your Atlassian org admin may need to enable the Rovo MCP server.
   - **Atlassian CLI** (for reading Jira): `brew tap atlassian/homebrew-acli && brew install acli && acli jira auth login --web`
   - **TestRail credentials**, as environment variables. Never commit them.
     ```bash
     export TESTRAIL_URL="https://yourcompany.testrail.io"
     export TESTRAIL_USER="you@example.com"
     export TESTRAIL_API_KEY="<api key>"
     ```

### Workflow 1: From Local Documents (no credentials)

1. Put the requirement documents in a folder under `docs/input/`. For example, the included sample:
   ```
   docs/input/harborcart-ecommerce/
   ├── Ecommerce_BRD_Sample.md
   └── Ecommerce_Architecture_Design_Sample.md
   ```
   `.md` and `.txt` files are read directly. `.docx`, `.rtf` and `.html` are converted with macOS `textutil`. PDFs may need exporting to `.docx` or `.md` first.

2. In Copilot Chat, pick **Test Cases Creation - E2E Test Creator v3 (Docs)** and send:
   ```
   Documents: docs/input/harborcart-ecommerce/. Run key: HARBORCART
   ```

3. The agent writes `reports/HARBORCART/test-plan-HARBORCART.md` and **stops for review**. It shows a table with each test's ID, name, type, priority, references and open questions. Reply with one or more of:

   | Reply                    | Effect                                               |
   | ------------------------ | ---------------------------------------------------- |
   | `approve all`            | Approve every test                                   |
   | `approve TC-001, TC-003` | Approve the listed tests                             |
   | `reject TC-004: <reason>`| Reject a test                                        |
   | `edit TC-002: <change>`  | Revise a test, then review it again                  |
   | `accept-open TC-007`     | Approve a test that still has open `?…?` expectations |
   | `stop`                   | Keep the test plan only; produce no JSON files       |

4. After approval, it writes and validates:
   ```
   reports/HARBORCART/
   ├── test-plan-HARBORCART.md              # comprehensive test plan (status updated)
   ├── gherkin-scenarios-HARBORCART.json    # approved tests: [{ testName, references, gherkin }]
   ├── testrail-cases-HARBORCART.json       # TestRail add_case payloads
   └── sync-manifest.json                   # test ID → status → TestRail case → Jira key
   ```

5. **Import into TestRail** when you have credentials. The script does a dry run by default:
   ```bash
   .github/skills/testrail/scripts/import-cases.sh reports/HARBORCART/testrail-cases-HARBORCART.json --section-id <id>          # preview
   .github/skills/testrail/scripts/import-cases.sh reports/HARBORCART/testrail-cases-HARBORCART.json --section-id <id> --apply  # import
   ```
   - The script validates each case first: required fields, WHEN/THEN step structure, and duplicate titles.
   - `--apply` refuses to import while any tests still contain `?…?` or `[TBD]` markers, unless you add `--allow-unresolved`.
   - It records created case IDs in `testrail-cases-HARBORCART.results.json`, so re-running it skips cases already imported.
   - `--only TC-001,TC-003` imports just the listed tests.

### Workflow 2: From Jira, into TestRail and Jira

1. Complete the [one-time setup](#one-time-setup) for the Jira + TestRail agent.
2. In Copilot Chat, pick **Test Cases Creation - E2E Test Creator v3 (Jira + TestRail)** and send one of:
   ```
   LOY-1234
   ```
   ```
   LOY-1234. Also use docs/input/loyalty-offers/ as extra sources.
   ```
   ```
   Continue reports/HARBORCART/ (import the approved Docs run)
   ```
3. The agent checks Atlassian and TestRail access first. If a check fails, it stops and tells you which one failed.
4. It stops for your approval **three times**:
   - to approve the tests (same replies as Workflow 1);
   - to confirm the TestRail import, after a dry run (you give the section ID);
   - to confirm the Jira tickets, after a preview.
5. It creates one Jira ticket per imported test, linked to the source epic, with the Gherkin and the TestRail case URL in the description. It never edits, transitions or deletes existing tickets or cases.

### Output Formats

Both agents follow the shared templates in `.github/templates/e2e-test-plan/`:

- **`test-plan-template.md`** sets the test plan layout:
  - Executive Summary;
  - 1 Functional Understanding;
  - 2 Technical Understanding (components, integration points, data flows, APIs);
  - 3 Testing Considerations (acceptance criteria, test cases, what could break, rollback, security, privacy);
  - 4 Test Execution Strategy;
  - 5 Risk Assessment;
  - 6 Sign-off;
  - Appendices: A (Gherkin tests), B (traceability and status), C (open questions).
- **`gherkin-style-guide.md`** sets the test style: flat `GIVEN/WHEN/THEN` Gherkin, with named fixtures, indented `with:` parameters, captured values (`T1`, `TXID1`), `(retriable)` reads, and `?…?` for anything the sources don't define.
- **Test IDs:** `TC-001` (functional and edge cases), `TC-S001` (security), `TC-P001` (privacy).

Example test (flat Gherkin):

```
GIVEN Product MUG-RED (ACTIVE, $24.00, stock 5)
AND Promotion SAVE10 (10% off eligible merchandise, cap $20)
AND Registered shopper U1
WHEN POST /checkout/quotes is called for U1 with:
   cart: MUG-RED x2
   promotionCode "save10"
THEN status 201 Created
AND the quote has discountCents 480
WHEN GET /orders is called for U1
THEN no order exists for the quote
```

Each TestRail case is built from the Gherkin like this:

| TestRail field           | Taken from                                      |
| ------------------------ | ----------------------------------------------- |
| `title`                  | The test name (`TC-003: …`)                     |
| `custom_preconds`        | A one-line summary, then the `GIVEN` block      |
| `custom_steps_separated` | One step per `WHEN` block; the `THEN` block after it is the expected result |
| `refs`                   | The requirement IDs (e.g. `BR-06,BR-07`)        |

Change the formats in these two template files; both agents pick up the changes.

### From Test Plan to Automated Tests

The Playwright agents turn plans into runnable specs:

1. **playwright-test-planner:** explores the app (starting from `tests/seed.spec.ts`) and saves a plan to `spec/`, e.g. `spec/greenkart-test-plan.md`.
2. **playwright-test-generator:** turns the plan items into specs under `tests/`, e.g. `tests/greenkart-shopping/search-and-add-product.spec.js`.
3. **playwright-test-healer:** reruns failing specs and fixes their locators and waits.

These agents use the `playwright-test` MCP server configured in `.vscode/mcp.json`.

### AI First-Pass Code Review

**Playwright Code Review Agent (First Pass)** reviews changes against this repo's rules:
- floating promises and missing `await`;
- hard waits, brittle locators, and non-web-first assertions;
- `test.only`, and specs that won't be discovered;
- page object method mismatches, `POManager` registration, and JS ↔ TS page object parity;
- Cucumber step matching;
- config and CI changes, committed artifacts, and secrets.

**A human always completes the review.**

1. **Setup (PR mode):** `brew install gh && gh auth login`. Local branch reviews need no setup.
2. In Copilot Chat, pick **Playwright Code Review Agent (First Pass)** and send `Review PR 12`, or `Review my current branch`.
3. The agent runs read-only checks:
   - `playwright test --list` on the changed specs;
   - a Cucumber `--dry-run`;
   - `node --check`;
   - artifact and secret scans.

   It then writes `reports/code-review-<id>.md` and **stops for your triage**:
   ```
   confirm all | confirm F-01, F-03 | dismiss F-02: <reason> | edit F-04: <text>
   reviewers: @qa-lead        run tests        publish        report only
   ```
4. **Publishing:** only after you reply `publish` and confirm a preview, it:
   - posts a **comment-only** review (inline comments on changed lines, plus a summary);
   - adds the `ai-first-pass-reviewed` label;
   - **requests a review from the named human reviewer**, and GitHub notifies them.
5. **The final decision is the reviewer's.** The agent never approves, requests changes, merges, pushes, or edits code. It doesn't run the tests unless you reply `run tests`.

GitHub won't request a review from the PR's own author. On a solo repo, the agent assigns and labels the PR instead, and its triage stop in chat is your notification.

The report and PR comment formats are in `.github/templates/code-review/report-template.md`.

### Release Certification Bug Analysis

**Release Certification Bug Analyzer** reads a release's certification tickets from Jira. It is **read-only**: it never modifies Jira, Confluence, TestRail, or code. It categorizes every ticket on eight dimensions, recording the evidence and a confidence level for each:

| Dimension | Values |
| --------- | ------ |
| Defect status | Defect · Not a defect · Duplicate · Cannot reproduce · Works as designed |
| Origin | Regression · New feature · Pre-existing · Unknown |
| Category | Functional · Integration · Data · UI/UX · Performance · Configuration/Environment · Security |
| Severity | Critical · High · Medium · Low (from the Severity field, or derived from priority) |
| Detection | Automation · Manual certification · Production · Unknown |
| Root cause | As stated in the ticket, or `Not stated` |
| Component | From Jira, or `Unassigned` |
| Expected test level | Unit · Integration/API · E2E · Regression suite · Exploratory |

1. **Setup:** the `atlassian-cli` skill (`acli jira auth login`), or the Atlassian MCP server in `.vscode/mcp.json`. Access is limited to the MLP and TCOE projects.
2. In Copilot Chat, pick **Release Certification Bug Analyzer** and send, for example: `Analyze release-2026.2 certification bugs, window 2026-09-01 to 2026-09-20`. Add `include test coverage` to also search this repo's specs, Gherkin features and test plans, plus any sibling repos checked out alongside it.
3. The agent writes `tmp/release-bugs-<run-id>/categorization.csv` and **stops for your review**:
   ```
   approve | set MLP-123 origin=Regression, category=Integration  [reason] | reload | include test coverage | stop
   ```
   Overrides are logged in the report's Human Review Log.
4. **After `approve`,** it writes `reports/release-bug-analysis/release-bug-analysis-<run-id>.md`:
   - an executive summary;
   - breakdowns by category, origin, severity, detection and component;
   - resolution outcomes, a timeline, and root causes;
   - coverage gaps and recommendations, each citing ticket keys.

   Stories and tasks in the query are reported but excluded from the defect percentages.

Because `reports/` is committed in this repo, review the report for client names and other sensitive details before committing it. By default the agent writes `Client A`, `Client B` instead of client names.

---

## Copilot Skills

Skills in `.github/skills/` give the agents access to external tools:

| Skill                     | Purpose                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `testrail`                | TestRail API: `testrail-api.sh` for lookups, `import-cases.sh` for validated imports |
| `atlassian-cli`           | Read-only Jira and Confluence access through `acli` (writes go through the Atlassian MCP server) |
| `glab-cli`                | GitLab merge requests, pipelines, and job logs                                     |
| `test-coverage-analyzer`  | Test coverage for a feature                                                        |
| `api-coverage-checker`    | OpenAPI/Swagger endpoints compared with the tests that cover them                  |
| `make-skill-template`     | Scaffolding for new skills                                                         |

---

## CI/CD

| Workflow                                   | Trigger                                   | Does                                                     |
| ------------------------------------------ | ----------------------------------------- | -------------------------------------------------------- |
| `.github/workflows/playwright.yml`         | Push / pull request to `main` or `master` | Installs dependencies and uploads the Playwright report artifact |
| `.github/workflows/copilot-setup-steps.yml`| Manual, or changes to the workflow file   | Prepares the environment for the Copilot coding agent (npm packages and Playwright browsers) |

To run the tests in CI on Azure Playwright Workspaces, add these steps to `playwright.yml`:
- Azure login (`azure/login` with the `AZURE_CREDENTIALS` secret);
- `npx playwright test --config=playwright.service.config.js`, with the `PLAYWRIGHT_SERVICE_URL` repository variable set.

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| An agent doesn't appear in the Copilot picker | Check the `.agent.md` frontmatter, then reload VS Code. Internal workers are hidden on purpose. |
| The Jira + TestRail agent stops at the access check | Start the `atlassian` MCP server and sign in, run `acli jira auth login --web`, and set the `TESTRAIL_*` variables |
| `import-cases.sh` says "has no numeric sectionId" | Pass `--section-id <id>` (the TestRail section to import into) |
| `import-cases.sh` refuses `--apply` | Resolve the listed `?…?` / `[TBD]` markers, or add `--allow-unresolved` after reviewing them |
| A PDF source can't be read | Export it to `.docx` or `.md` into the same `docs/input/` folder |
| Browsers are missing | `npx playwright install --with-deps` |
| Tests run headless, or the report doesn't open | The `CI` environment variable is set in your shell. Run `unset CI`. |
| `npm run test:cucumber` reports 0 scenarios | Keep the `feature/` path argument in the script; Cucumber otherwise looks in `features/` |

---

## Resources

- [Playwright documentation](https://playwright.dev/docs/intro)
- [Playwright test agents](https://playwright.dev/docs/test-agents)
- [Azure Playwright Workspaces](https://aka.ms/pww/docs/config)
- [VS Code custom agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [GitHub Copilot documentation](https://docs.github.com/en/copilot)
- [Atlassian Rovo MCP server](https://github.com/atlassian/atlassian-mcp-server)
- TestRail API reference: `.github/skills/testrail/references/api-reference.md`
