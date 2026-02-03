# docusaurus-jupyter

A proof-of-concept that renders Jupyter notebooks as pages in a [Docusaurus](https://docusaurus.io/) documentation site. Notebooks are converted to Markdown via [Quarto](https://quarto.org/) and served as static content by Docusaurus.

## Architecture

```
notebooks/*.ipynb
       │
       ▼
   quarto render        (converts .ipynb → .md)
       │
       ▼
docs/notebooks/*.md     (Markdown consumed by Docusaurus)
       │
       ▼
   docusaurus build     (static site generation)
       │
       ▼
   build/               (deployable static site)
```

## Project Structure

```
docusaurus-jupyter/
├── docs/
│   ├── intro.md                 # Landing page
│   └── notebooks/               # Quarto-generated Markdown (git-ignored)
├── notebooks/
│   ├── 01-pipeline-basics.ipynb # Pipeline definition and stage overview
│   └── 02-pipeline-results.ipynb# Pipeline run results and diagnostics
├── src/                         # Docusaurus custom components
├── static/                      # Static assets
├── _quarto.yml                  # Quarto project config
├── docusaurus.config.js         # Docusaurus config
├── sidebars.js                  # Sidebar navigation
└── package.json
```

## Prerequisites

| Dependency | Version  |
|-----------|----------|
| Node.js   | >= 20    |
| Python    | >= 3.10  |
| Quarto    | >= 1.4   |

Install Quarto from [quarto.org/docs/get-started](https://quarto.org/docs/get-started/).

## Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd docusaurus-jupyter
   ```

2. **Install Node dependencies**

   ```bash
   npm install
   ```

3. **Install Python dependencies** (needed for notebook execution)

   ```bash
   pip install pandas
   ```

## Run

### Convert notebooks to Markdown

```bash
quarto render notebooks/ --to docusaurus-md --output-dir docs/notebooks/
```

### Start the dev server

```bash
npm start
```

This launches a local development server at `http://localhost:3000`. Changes to docs are reflected live without restarting.

### Production build

```bash
npm run build
```

Generates static content into the `build/` directory.

### Full build from scratch

```bash
quarto render notebooks/ --to docusaurus-md --output-dir docs/notebooks/
npm run build
```

## Sample Notebooks

| Notebook | Description |
|----------|-------------|
| `01-pipeline-basics.ipynb` | Defines a Document Q&A pipeline, explains how steps compose, and renders a DataFrame summary of stages, inputs, and outputs. |
| `02-pipeline-results.ipynb` | Inspects pipeline run results with a per-step status/duration table and a formatted run summary. |

Both notebooks are pre-executed with outputs embedded in the `.ipynb` files. No runtime kernel is required to build the site.
