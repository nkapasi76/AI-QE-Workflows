# Release Bug Analysis Templates (Release Certification Bug Analyzer)

The Release Certification Bug Analyzer uses these templates:
1. **Categorization sheet:** `tmp/release-bugs-<run-id>/categorization.csv`, reviewed at the human gate
2. **Report:** `reports/release-bug-analysis/release-bug-analysis-<run-id>.md`

Rules:
- Every number in the report must be computable from the categorization sheet.
- Percentages use the stated denominator (defects only, unless the row says otherwise).
- Keep the heading order. Write `Not assessed` rather than removing a section.

## 1. Categorization Sheet (CSV)

One row per ticket. Values come from the taxonomy in the agent file. `evidence` cites the field or comment each value came from. `human_override` records any change made at the gate.

```csv
key,summary,issue_type,defect_status,origin,category,severity,severity_source,detection,root_cause,component,expected_test_level,confidence,evidence,human_override
MLP-123,"Offer not applied at checkout",Bug,Defect,Regression,Functional,High,customfield_13067,Manual certification,Regression not caught,Offers,E2E,High,"label: regression; comment 2026-03-02 (QA): worked in 2026.1",
MLP-130,"Add export button",Story,Not a defect (Story),N/A,N/A,N/A,N/A,N/A,N/A,Reporting,N/A,High,"issue type Story",
```

## 2. Report Template

~~~~markdown
# Release Certification Bug Analysis — <release>

**Generated:** <YYYY-MM-DD HH:MM UTC> · **Run ID:** <run-id>
**Release:** <release label/version> · **Certification window:** <start> → <end, or "not provided">
**Tickets analyzed:** <n total> (<n defects>, <n not defects>)
**Coverage analysis:** Included (<repos>) / Not requested
**Categorization reviewed by:** <name/handle> on <date> (<n> overrides)

---

## Executive Summary

<2–3 short paragraphs: what the release's defects say about test effectiveness.>

**Key metrics** (defects only; n = <defects>):

| Metric | Count | % |
| ------ | ----- | - |
| Defects | n | 100% |
| Critical + High severity | n | % |
| Regression | n | % |
| New feature | n | % |
| Pre-existing (escaped earlier) | n | % |
| Origin unknown | n | % |
| Found by automation | n | % |
| Found manually in certification | n | % |

**Top findings** (each cites ticket keys):
1. <finding> (MLP-…, MLP-…)
2. …
3. …

**Immediate actions:**
1. <action>
2. …

## 1. Scope and Data

- **JQL:** `<exact query>`
- **Ticket breakdown by type:** Bug n · Story n · Task n · Other n
- **Excluded from defect metrics:** <n> tickets (Not a defect / Duplicate / Cannot reproduce / Works as designed), listed in Appendix A
- **Severity source:** `customfield_13067` for n tickets; derived from priority for n tickets

## 2. Categorization Results

### 2.1 Defects by Category

| Category | Defects | % | Critical/High | Examples |
| -------- | ------- | - | ------------- | -------- |

### 2.2 Defects by Origin

| Origin | Defects | % | Examples |
| ------ | ------- | - | -------- |

### 2.3 Defects by Severity

| Severity | Defects | % |
| -------- | ------- | - |

### 2.4 Defects by Detection Method

| Detection | Defects | % | Notes |
| --------- | ------- | - | ----- |

### 2.5 Defects by Component (hot spots)

| Component | Defects | Critical/High | Regressions | Top categories |
| --------- | ------- | ------------- | ----------- | -------------- |

```
Defects by component
Offers     ████████████ 12
Checkout   ███████ 7
```

### 2.6 Resolution Outcomes (all tickets)

| Resolution | Tickets | Signal |
| ---------- | ------- | ------ |
| Duplicate | n | Overlapping reports or communication gaps |
| Cannot Reproduce | n | Environment or test data problems |
| Won't Fix | n | Prioritization |

### 2.7 Timeline

<When defects were found in the certification window: counts by week or day, and late-found Critical/High defects. "Not assessed" if no window was provided.>

## 3. Root Causes

| Root cause | Defects | % | Components | Examples |
| ---------- | ------- | - | ---------- | -------- |
| Not stated in ticket | n | % | | |

## 4. Coverage Gaps

### 4.1 Expected Test Level (always)

| Expected level | Defects | Examples |
| -------------- | ------- | -------- |
| Unit | n | |
| Integration / API | n | |
| E2E | n | |
| Regression suite | n | |

### 4.2 Actual Coverage (only if coverage analysis was requested)

<"Not requested", or per high-risk area:>

#### Gap G-1: <component/feature>

- **Evidence:** MLP-… (<summary>), MLP-…
- **Existing coverage found:** <files/specs/collections, with paths> or "none found"
- **Missing:** <scenario/test type>
- **Recommendation:** <specific test to add, and where>
- **Priority:** High/Medium/Low (impact: …; effort estimate: … (estimate))

## 5. Recommendations

### Immediate (next sprint)

1. **<title>**
   - **Why:** <data, with keys>
   - **What:** <deliverable>
   - **Suggested owner:** <team, or "TBD">
   - **Impact:** …

### Short term (2–3 sprints)

### Process improvements

## 6. Focus Areas for Upcoming Sprints

| Component | Priority | Test types needed | Rationale (keys) |
| --------- | -------- | ----------------- | ---------------- |

## Appendix A: All Tickets

| Key | Summary | Type | Defect status | Origin | Category | Severity | Detection | Root cause | Component | Confidence | Override |
| --- | ------- | ---- | ------------- | ------ | -------- | -------- | --------- | ---------- | --------- | ---------- | -------- |

## Appendix B: Human Review Log

| Key | Field | Agent value | Human value | Reason |
| --- | ----- | ----------- | ----------- | ------ |

## Appendix C: Method and Limitations

- **Sources:** Jira (<projects>), Confluence (<searches>), repositories (<paths>, or "none")
- **Taxonomy:** Release Certification Bug Analyzer <version>
- **Limitations:** <missing fields, unassigned components, tickets without comments, inferred values>
- **Data files:** `tmp/release-bugs-<run-id>/` (local only; not committed)

_Generated by the Release Certification Bug Analyzer, with the categorization reviewed by a human. Effort estimates are indicative only._
~~~~
