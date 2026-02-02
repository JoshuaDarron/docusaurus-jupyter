# PRD: Docusaurus + Jupyter Notebook POC

## Project Overview

A minimal proof-of-concept that renders Jupyter notebooks as pages in a Docusaurus documentation site, targeting documentation for an AI pipeline orchestration tool. Notebooks are converted to Markdown via Quarto and served as static content by Docusaurus, with opt-in interactive rendering where needed.

## Goals

- Prove that Quarto can convert `.ipynb` files into Markdown that Docusaurus v3 renders correctly
- Render rich text and tables from notebook output
- Establish a repeatable build pipeline (`quarto render` → `docusaurus build`)
- Deliver 1–2 sample notebooks demonstrating AI pipeline orchestration documentation

## Non-Goals

- Production deployment, CI/CD, or hosting configuration
- Interactive widget support (Jupyter widgets, Plotly, etc.)
- Notebook execution at build time — notebooks are pre-run
- Auth, versioning, search, or multi-language support
- Styling or theme customization beyond Docusaurus defaults

## Architecture

```
notebooks/*.ipynb
       │
       ▼
   quarto render        (converts .ipynb → .md)
       │
       ▼
docs/notebooks/*.md     (Markdown output consumed by Docusaurus)
       │
       ▼
   docusaurus build     (static site generation)
       │
       ▼
   build/               (deployable static site)
```

Quarto is chosen for its first-class Docusaurus support. It handles front-matter injection, output rendering, and Markdown formatting so Docusaurus can treat converted notebooks like any other doc page.

## Project Structure

```
docusaurus-jupyter/
├── docs/
│   ├── intro.md              # Landing / intro page
│   └── notebooks/            # Quarto-generated Markdown (git-ignored)
├── notebooks/
│   ├── 01-pipeline-basics.ipynb
│   └── 02-pipeline-results.ipynb
├── src/                      # Docusaurus custom components (if needed)
├── static/                   # Static assets
├── _quarto.yml               # Quarto project config
├── docusaurus.config.js      # Docusaurus config
├── sidebars.js               # Sidebar navigation
├── package.json
├── PRD.md
└── README.md
```

## Requirements

### Functional

1. **Notebook rendering** — Converted notebooks display rich text (Markdown cells) and tables (pandas DataFrame output) without visual breakage.
2. **Navigation** — Notebooks appear in the Docusaurus sidebar alongside standard doc pages.
3. **Static by default** — All notebook content renders as static HTML. No client-side kernel or execution.
4. **Opt-in interactivity** — The architecture does not block adding interactive elements later (e.g., embedded code blocks with copy buttons), but this POC does not implement them.

### Technical

| Dependency   | Version    |
|-------------|------------|
| Docusaurus  | v3 (latest)|
| Quarto      | >= 1.4     |
| Node.js     | >= 18      |
| Python      | >= 3.10    |

## Sample Notebook Spec

### Notebook 1 — Pipeline Basics (`01-pipeline-basics.ipynb`)

- Markdown cells explaining what an AI pipeline is and how steps are composed
- A code cell defining a simple pipeline (e.g., list of steps with descriptions)
- A code cell producing a pandas DataFrame table summarizing pipeline stages, inputs, and outputs

### Notebook 2 — Pipeline Results (`02-pipeline-results.ipynb`)

- Markdown cells describing how to inspect pipeline run results
- A code cell generating a results table (status, duration, output summary per step)
- A code cell producing a formatted text summary of a pipeline run

Both notebooks should be pre-executed so outputs are embedded in the `.ipynb` files.

## Build Workflow

```bash
# 1. Convert notebooks to Docusaurus-compatible Markdown
quarto render notebooks/ --to docusaurus-md --output-dir docs/notebooks/

# 2. Install dependencies (first time / when changed)
npm install

# 3. Local dev server
npx docusaurus start

# 4. Production build
npx docusaurus build
```

The exact Quarto command and flags will be validated during implementation. The `_quarto.yml` config file will define output format and directory mapping.

## Success Criteria

The POC is complete when:

1. `quarto render` converts both sample notebooks to Markdown without errors
2. `npx docusaurus build` produces a static site without errors
3. Both notebooks are accessible via sidebar navigation
4. Rich text renders correctly (headings, paragraphs, inline code, bold/italic)
5. Tables render as formatted HTML tables, not raw text
6. The dev server (`npx docusaurus start`) serves the site locally for review
