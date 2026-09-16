# API Coverage Checker - File Index

Complete reference of all files in the api-coverage-checker skill and their purposes.

## Core Files

### SKILL.md

**Purpose**: Main skill instruction file with complete workflow and analysis steps  
**Used by**: GitHub Copilot agent - loaded when skill is activated  
**Contains**:

- When to use this skill
- Required parameters (domain, optional filters)
- Step-by-step analysis workflow (9 steps)
- Report structure template
- Coverage calculation methods
- Tips for effective analysis
- Troubleshooting guide
- Example usage scenarios

**When to read**: Always read this first when performing API coverage analysis

---

### README.md

**Purpose**: Quick start guide and overview  
**Used by**: Humans browsing the skill, quick reference  
**Contains**:

- Quick start examples
- Usage patterns
- Parameter descriptions
- Output format
- Links to related skills

**When to read**: For a quick overview before diving into SKILL.md

---

## Reference Documents

### references/example-report.md

**Purpose**: Complete example of a coverage report output  
**Used by**: Reference for report structure and format  
**Contains**:

- Executive summary example
- Detailed endpoint analysis examples
- Field coverage tables
- Scenario coverage indicators
- Gap identification examples
- Recommendations section
- Appendix sections

**When to use**:

- As a template when generating reports
- To understand expected report format
- To see examples of coverage categorization
- To check markdown formatting

---

### references/swagger-openapi-formats.md

**Purpose**: Technical reference for parsing swagger 2.0 and openapi 3.0 formats  
**Used by**: Understanding differences between API documentation formats  
**Contains**:

- Format detection methods
- Schema definitions location differences
- Request body structure differences
- Response format differences
- Universal parser functions
- Field types reference
- Validation keywords

**When to use**:

- When parsing swagger/openapi JSON files
- When resolving schema references ($ref)
- When extracting request/response schemas
- When handling both swagger 2.0 and openapi 3.0

---

### references/troubleshooting.md

**Purpose**: Solutions to common issues during API coverage analysis  
**Used by**: Debugging analysis problems  
**Contains**:

- Issue: Cannot find test files for endpoint
- Issue: Schema reference cannot be resolved
- Issue: Field coverage incorrectly reported
- Issue: Test file found but endpoint appears uncovered
- Issue: Response field coverage too low
- Issue: Version filter not working
- Issue: Report generation fails
- Best practices
- Quick diagnostic checklist

**When to use**:

- When analysis results seem incorrect
- When test files aren't found
- When schema resolution fails
- When field coverage seems wrong
- Before reporting an issue

---

## Scripts

### scripts/parse-swagger.js

**Purpose**: Utility script to parse and extract information from swagger/openapi JSON files  
**Type**: Node.js executable script  
**Used by**: Command-line or programmatically in analysis  
**Features**:

- Load and parse swagger/openapi JSON
- Extract all API endpoints with filters
- Resolve schema references
- Extract request/response fields
- Generate summary reports
- Generate detailed endpoint reports

**Usage**:

```bash
# Show all endpoints
node scripts/parse-swagger.js docs/API/offers-swagger.json --summary

# Filter by version
node scripts/parse-swagger.js docs/API/offers-swagger.json --version 2.0

# Detailed analysis of specific endpoint
node scripts/parse-swagger.js docs/API/offers-swagger.json --path /management --detailed
```

**When to use**:

- Quick analysis of swagger file contents
- Extracting endpoint information for report
- Testing schema resolution
- Debugging swagger parsing issues
- Understanding API structure before test analysis

**Programmatic usage**:

```javascript
const SwaggerParser = require('./.github/skills/api-coverage-checker/scripts/parse-swagger.js');

const parser = new SwaggerParser('docs/API/offers-swagger.json');
parser.load();

// Get all endpoints
const endpoints = parser.getPaths({ version: '2.0' });

// Get request schema
const requestSchema = parser.getRequestSchema(operation);

// Extract fields
const fields = parser.extractFields(requestSchema);
```

---

## Directory Structure

```
.github/skills/api-coverage-checker/
├── SKILL.md                              # Main skill instructions
├── README.md                             # Quick start guide
├── FILE_INDEX.md                         # This file
│
├── references/                           # Reference documentation
│   ├── example-report.md                 # Example coverage report
│   ├── swagger-openapi-formats.md        # Format reference guide
│   └── troubleshooting.md                # Problem-solving guide
│
└── scripts/                              # Utility scripts
    └── parse-swagger.js                  # Swagger/OpenAPI parser
```

---

## Typical Workflow

When performing API coverage analysis, files are used in this order:

1. **SKILL.md** → Read complete instructions and workflow
2. **swagger-openapi-formats.md** → Reference while parsing swagger files
3. **parse-swagger.js** → Extract API endpoint information
4. **example-report.md** → Reference for report structure
5. **troubleshooting.md** → Consult if issues arise
6. **README.md** → Quick reference for parameters

---

## File Usage by Task

### Task: Analyze Offers Domain Coverage

```
1. Read: SKILL.md (Steps 1-9)
2. Use: parse-swagger.js docs/API/offers-swagger.json --summary
3. Reference: swagger-openapi-formats.md (for schema resolution)
4. Follow: SKILL.md Step 5-7 (search test files, analyze coverage)
5. Generate report using: example-report.md (as template)
6. Troubleshoot with: troubleshooting.md (if needed)
```

### Task: Understand Report Format

```
1. Read: README.md (quick overview)
2. Study: example-report.md (complete example)
3. Review: SKILL.md Step 8 (report structure)
```

### Task: Debug Schema Resolution

```
1. Check: troubleshooting.md (Issue 2)
2. Reference: swagger-openapi-formats.md (schema definitions)
3. Test: parse-swagger.js with --detailed flag
4. Review: SKILL.md Step 2-4 (schema parsing)
```

### Task: Quick Swagger File Analysis

```
1. Run: parse-swagger.js with appropriate flags
2. Reference: README.md (for parameter options)
3. Check: swagger-openapi-formats.md (if format unclear)
```

---

## Maintenance Notes

### When to Update

**SKILL.md**:

- Workflow changes
- New analysis patterns discovered
- Coverage calculation methods change

**example-report.md**:

- Report format changes
- New sections added
- Better examples found

**swagger-openapi-formats.md**:

- New swagger/openapi versions
- Additional parsing patterns needed
- Format differences discovered

**troubleshooting.md**:

- New issues encountered
- Better solutions found
- Common patterns identified

**parse-swagger.js**:

- Bug fixes
- New features needed
- Performance improvements
- Support for additional formats

---

## Related Skills

- **test-coverage-analyzer**: General test coverage analysis (not API-specific)
- **make-skill-template**: Creating new skills like this one

---

## Quick Reference Card

| Need                    | File                                  |
| ----------------------- | ------------------------------------- |
| How to perform analysis | SKILL.md                              |
| Quick start             | README.md                             |
| Report template         | references/example-report.md          |
| Parse swagger file      | scripts/parse-swagger.js              |
| Format differences      | references/swagger-openapi-formats.md |
| Fix analysis issues     | references/troubleshooting.md         |
| Understand this skill   | FILE_INDEX.md (this file)             |

---

_Last updated: 2026-02-12_
