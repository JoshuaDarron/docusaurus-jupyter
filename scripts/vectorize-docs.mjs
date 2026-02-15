import 'dotenv/config';
import { createRequire } from 'module';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename, extname, relative } from 'path';

// Load aparavi-client via CJS — its ESM build has bare directory imports
// that Node's strict ESM resolver doesn't support.
const require = createRequire(import.meta.url);
const { AparaviClient } = require('aparavi-client');

const ROOT = join(import.meta.dirname, '..');
const PIPELINE_FILE = join(ROOT, 'pipelines', 'rag-pipeline.json');

// Directories and extensions to index
const CONTENT_SOURCES = [
	{ dir: join(ROOT, 'docs'), exts: ['.md', '.mdx'] },
	{ dir: join(ROOT, 'notebooks'), exts: ['.ipynb'] },
	{ dir: join(ROOT, 'pipelines'), exts: ['.json'] },
	{ dir: join(ROOT, 'src', 'components'), exts: ['.js', '.jsx'] },
];

// Standalone root-level files to index
const ROOT_FILES = ['README.md', 'PRD.md'].map((f) => join(ROOT, f));

/** Recursively collect files matching the given extensions. */
function collectFiles(dir, exts) {
	const files = [];
	if (!existsSync(dir)) return files;
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			files.push(...collectFiles(full, exts));
		} else if (exts.includes(extname(entry))) {
			files.push(full);
		}
	}
	return files;
}

/** Extract markdown + code cells from a Jupyter notebook into readable markdown text. */
function notebookToMarkdown(filePath) {
	const nb = JSON.parse(readFileSync(filePath, 'utf-8'));
	const parts = [];
	for (const cell of nb.cells || []) {
		const source = (cell.source || []).join('');
		if (!source.trim()) continue;
		if (cell.cell_type === 'markdown') {
			parts.push(source);
		} else if (cell.cell_type === 'code') {
			parts.push('```python\n' + source + '\n```');
		}
	}
	return parts.join('\n\n');
}

/** Read a file and return { name, content } ready for upload.
 *  Notebooks are converted to markdown; everything else is read as-is. */
function readForUpload(filePath) {
	const ext = extname(filePath);
	// Use path relative to ROOT so filenames are unique across directories
	const name = relative(ROOT, filePath).replace(/[\\/]/g, '--');

	if (ext === '.ipynb') {
		const md = notebookToMarkdown(filePath);
		return { name: name.replace('.ipynb', '.md'), content: md, mime: 'text/markdown' };
	}
	const content = readFileSync(filePath, 'utf-8');
	const mime = ['.md', '.mdx'].includes(ext) ? 'text/markdown' : 'text/plain';
	return { name, content, mime };
}

/** Collect all content files from configured sources. */
function collectAllContent() {
	const allPaths = [];

	for (const { dir, exts } of CONTENT_SOURCES) {
		allPaths.push(...collectFiles(dir, exts));
	}

	for (const f of ROOT_FILES) {
		if (existsSync(f)) allPaths.push(f);
	}

	// Exclude the rag-pipeline.json itself to avoid circular indexing
	return allPaths.filter((p) => basename(p) !== 'rag-pipeline.json');
}

async function main() {
	const apiKey = process.env.APARAVI_API_KEY;
	const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
	const qdrantUrl = process.env.QDRANT_URL;
	const qdrantApiKey = process.env.QDRANT_API_KEY;
	const uri = process.env.APARAVI_BASE_URL || 'https://eaas.aparavi.com:443';

	if (!apiKey) {
		console.error('APARAVI_API_KEY is required. Set it in your .env file.');
		process.exit(1);
	}

	if (!anthropicApiKey) {
		console.error('ANTHROPIC_API_KEY is required. Set it in your .env file.');
		process.exit(1);
	}

	if (!qdrantUrl) {
		console.error('QDRANT_URL is required. Set it in your .env file.');
		process.exit(1);
	}

	if (!qdrantApiKey) {
		console.error('QDRANT_API_KEY is required. Set it in your .env file.');
		process.exit(1);
	}

	console.log('Collecting content files...');
	const contentPaths = collectAllContent();
	console.log(`Found ${contentPaths.length} content files:`);
	for (const p of contentPaths) {
		console.log(`  ${relative(ROOT, p)}`);
	}

	if (contentPaths.length === 0) {
		console.log('No content files found. Skipping vectorization.');
		return;
	}

	// Load pipeline config and inject secrets from environment
	const pipelineExport = JSON.parse(readFileSync(PIPELINE_FILE, 'utf-8'));
	const llmComponent = pipelineExport.components.find((c) => c.id === 'llm_anthropic_1');
	if (llmComponent) {
		llmComponent.config['claude-opus-4-1'].apikey = anthropicApiKey;
	}
	const qdrantComponent = pipelineExport.components.find((c) => c.id === 'qdrant_1');
	if (qdrantComponent) {
		qdrantComponent.config.cloud.host = qdrantUrl;
		qdrantComponent.config.cloud.apikey = qdrantApiKey;
	}

	const client = new AparaviClient({ auth: apiKey, uri });

	try {
		console.log(`Connecting to ${uri}...`);
		await client.connect();

		console.log('Starting pipeline...');
		const { token } = await client.use({
			pipeline: { pipeline: pipelineExport },
		});
		console.log(`Pipeline started (token: ${token})`);

		// Build File objects for upload — notebooks are converted to markdown,
		// other files are read as-is with appropriate MIME types.
		const files = contentPaths.map((filePath) => {
			const { name, content, mime } = readForUpload(filePath);
			const file = new File([content], name, { type: mime });
			return { file };
		});

		console.log(`Uploading ${files.length} files...`);
		const results = await client.sendFiles(files, token, 5);
		const succeeded = results.filter((r) => r.action === 'complete').length;
		const failed = results.filter((r) => r.action === 'error').length;
		console.log(`Upload complete: ${succeeded} succeeded, ${failed} failed`);

		if (failed > 0) {
			for (const r of results.filter((r) => r.action === 'error')) {
				console.error(`  Failed: ${r.filepath} — ${r.error}`);
			}
		}

		// Poll until pipeline finishes processing
		console.log('Waiting for vectorization to complete...');
		let status;
		do {
			await new Promise((resolve) => setTimeout(resolve, 2000));
			status = await client.getTaskStatus(token);
			if (status.totalCount > 0) {
				console.log(`  Progress: ${status.completedCount}/${status.totalCount}`);
			}
		} while (!status.completed);

		console.log('Vectorization complete!');

		await client.terminate(token);
	} finally {
		await client.disconnect();
	}
}

main().catch((err) => {
	console.error('Error during vectorization:', err);
	process.exit(1);
});
