import 'dotenv/config';
import { createRequire } from 'module';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';

// Load aparavi-client via CJS — its ESM build has bare directory imports
// that Node's strict ESM resolver doesn't support.
const require = createRequire(import.meta.url);
const { AparaviClient } = require('aparavi-client');

const DOCS_DIR = join(import.meta.dirname, '..', 'docs');
const PIPELINE_FILE = join(import.meta.dirname, '..', 'pipelines', 'rag-pipeline.json');

function collectDocFiles(dir) {
	const files = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			files.push(...collectDocFiles(full));
		} else if (['.md', '.mdx'].includes(extname(entry))) {
			files.push(full);
		}
	}
	return files;
}

async function main() {
	const apiKey = process.env.APARAVI_API_KEY;
	const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
	const uri = process.env.APARAVI_BASE_URL || 'wss://dtc.aparavi.com';

	if (!apiKey) {
		console.error('APARAVI_API_KEY is required. Set it in your .env file.');
		process.exit(1);
	}

	if (!anthropicApiKey) {
		console.error('ANTHROPIC_API_KEY is required. Set it in your .env file.');
		process.exit(1);
	}

	console.log('Collecting doc files...');
	const docPaths = collectDocFiles(DOCS_DIR);
	console.log(`Found ${docPaths.length} doc files`);

	if (docPaths.length === 0) {
		console.log('No doc files found. Skipping vectorization.');
		return;
	}

	// Load pipeline config and inject Anthropic API key into LLM component
	const pipelineExport = JSON.parse(readFileSync(PIPELINE_FILE, 'utf-8'));
	const llmComponent = pipelineExport.components.find((c) => c.id === 'llm_anthropic_1');
	if (llmComponent) {
		llmComponent.config['claude-opus-4-1'].apikey = anthropicApiKey;
	}

	const client = new AparaviClient({ auth: apiKey, uri });

	try {
		console.log(`Connecting to ${uri}...`);
		await client.connect();

		console.log('Starting pipeline...');
		const { token } = await client.use({
			pipeline: { components: pipelineExport.components },
		});
		console.log(`Pipeline started (token: ${token})`);

		// Build File objects for upload
		const files = docPaths.map((filePath) => {
			const content = readFileSync(filePath);
			const name = basename(filePath);
			const file = new File([content], name, { type: 'text/markdown' });
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
