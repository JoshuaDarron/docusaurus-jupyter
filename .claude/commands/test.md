# Test Command

Run all available checks and tests for the project.

---

## Workflow

### 1. Install Dependencies

Ensure dependencies are up to date:

```bash
npm install
```

### 2. Build Check

Run a production build to catch compilation errors, broken links, and invalid MDX:

```bash
npx docusaurus clear && npm run build
```

### 3. Type Check (if configured)

If TypeScript is configured, run the type checker:

```bash
npx tsc --noEmit
```

Skip this step if no `tsconfig.json` exists.

### 4. Lint Check (if configured)

If a linter is configured, run it:

```bash
npx eslint . --ext .js,.jsx,.ts,.tsx,.md,.mdx
```

Skip this step if no ESLint config exists.

### 5. Unit Tests (if configured)

If a test runner is configured (Jest, Vitest, etc.), run it:

```bash
npm test
```

Skip this step if no test script is defined in `package.json` or if it is the default placeholder.

### 6. Report Results

Provide a summary table:

```
## Test Results

| Check          | Status | Notes          |
|----------------|--------|----------------|
| Dependencies   | ...    | ...            |
| Build          | ...    | ...            |
| Type Check     | ...    | ...            |
| Lint           | ...    | ...            |
| Unit Tests     | ...    | ...            |
```

- For each **failed** check, analyze the error and suggest a fix.
- For each **skipped** check, note why it was skipped (not configured, no config file, etc.).

---

## Quick Reference

```bash
# Full check sequence
npm install && npx docusaurus clear && npm run build
```
