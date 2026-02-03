# Review Command

Review all uncommitted changes in the working tree and provide actionable feedback.

---

## Workflow

### 1. Gather Changes

```bash
git status && git diff HEAD
```

### 2. Review Each Changed File

For every modified, added, or deleted file, evaluate the following:

#### Correctness
- Does the code do what it intends to do?
- Are there logic errors, off-by-one mistakes, or unhandled edge cases?
- Are imports and dependencies correct?

#### Security
- No hardcoded secrets, API keys, or credentials.
- No injection vulnerabilities (XSS, SQL injection, command injection).
- No sensitive data logged or exposed.

#### Style & Consistency
- Does the code follow the existing patterns in the codebase?
- Are naming conventions consistent?
- Is there dead code, commented-out code, or debug statements (`console.log`, `debugger`)?

#### Documentation
- Are complex sections adequately commented?
- Do new exports or public APIs have clear names?

#### Docusaurus-Specific
- MDX files use valid syntax and render correctly.
- Front matter fields (`title`, `slug`, `tags`, etc.) are present and correct.
- Static assets referenced in docs exist in the `static/` directory.
- Sidebar and navbar config changes are valid.

### 3. Summarize Findings

Provide a summary with:
- **Issues** — Problems that should be fixed before committing, ordered by severity.
- **Suggestions** — Optional improvements that are not blocking.
- **Verdict** — One of: `Ready to commit`, `Needs changes`, or `Needs discussion`.

---

## Output Format

```
## Review Summary

### Issues
- [file:line] Description of the problem.

### Suggestions
- [file:line] Optional improvement.

### Verdict
Ready to commit | Needs changes | Needs discussion
```

---

## Quick Reference

```bash
# See all uncommitted changes
git status && git diff HEAD
```
