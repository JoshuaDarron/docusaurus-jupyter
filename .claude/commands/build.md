# Build Command

Build the Docusaurus site for production and report any errors.

---

## Workflow

### 1. Clean Previous Build

Remove cached and previously built artifacts to ensure a fresh build:

```bash
npx docusaurus clear
```

### 2. Run Production Build

```bash
npm run build
```

### 3. Report Results

- If the build **succeeds**, summarize the output (bundle size, pages generated, warnings).
- If the build **fails**, analyze the error output and suggest fixes.
  - Identify the failing file and line number.
  - Check for common issues: broken links, invalid MDX syntax, missing imports, or misconfigured plugins.
  - Propose a concrete fix.

---

## Common Build Errors

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `MDX compilation error` | Invalid JSX or markdown syntax | Check the referenced file for unclosed tags or bad expressions |
| `Broken link` | Dead internal link | Update or remove the link in the source file |
| `Module not found` | Missing dependency or bad import path | Run `npm install` or fix the import |
| `Config error` | Bad `docusaurus.config.js` | Validate the config against the Docusaurus docs |

---

## Quick Reference

```bash
# Clean and build
npx docusaurus clear && npm run build
```
