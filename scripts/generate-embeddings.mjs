import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, relative, basename, extname } from 'path';
import { pipeline } from '@huggingface/transformers';

const DOCS_DIR = join(import.meta.dirname, '..', 'docs');
const OUTPUT_DIR = join(import.meta.dirname, '..', 'static', 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'doc-embeddings.json');

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

function stripFrontmatter(text) {
  const match = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? text.slice(match[0].length) : text;
}

function stripMdx(text) {
  // Remove import statements
  text = text.replace(/^import\s+.*$/gm, '');
  // Remove JSX component tags like <PipelineResults ... /> or <Component>...</Component>
  text = text.replace(/<[A-Z][A-Za-z]*\b[^>]*\/>/g, '');
  text = text.replace(/<[A-Z][A-Za-z]*\b[^>]*>[\s\S]*?<\/[A-Z][A-Za-z]*>/g, '');
  // Remove code fences but keep content for context
  text = text.replace(/```[\s\S]*?```/g, '');
  return text.trim();
}

function chunkByHeadings(text, filePath) {
  const relPath = relative(join(import.meta.dirname, '..'), filePath);
  // Build doc URL from file path
  const docPath = relative(join(import.meta.dirname, '..', 'docs'), filePath)
    .replace(/\\/g, '/')
    .replace(/\.mdx?$/, '')
    .replace(/\/index$/, '');
  const url = `/docs/${docPath}`;

  const lines = text.split(/\r?\n/);
  const chunks = [];
  let currentTitle = basename(filePath, extname(filePath));
  let currentLines = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      // Save previous chunk
      if (currentLines.length > 0) {
        const chunkText = currentLines.join('\n').trim();
        if (chunkText.length > 20) {
          chunks.push({ title: currentTitle, text: chunkText, source: relPath, url });
        }
      }
      currentTitle = headingMatch[2].replace(/[*_`]/g, '');
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  // Last chunk
  if (currentLines.length > 0) {
    const chunkText = currentLines.join('\n').trim();
    if (chunkText.length > 20) {
      chunks.push({ title: currentTitle, text: chunkText, source: relPath, url });
    }
  }

  return chunks;
}

async function main() {
  console.log('Collecting doc files...');
  const files = collectDocFiles(DOCS_DIR);
  console.log(`Found ${files.length} doc files`);

  const allChunks = [];
  for (const file of files) {
    const raw = readFileSync(file, 'utf-8');
    const cleaned = stripMdx(stripFrontmatter(raw));
    const chunks = chunkByHeadings(cleaned, file);
    allChunks.push(...chunks);
  }
  console.log(`Created ${allChunks.length} chunks`);

  console.log('Loading embedding model (this may take a moment on first run)...');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  console.log('Generating embeddings...');
  const results = [];
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    // Embed title + text for better semantic matching
    const input = `${chunk.title}\n${chunk.text}`.slice(0, 512);
    const output = await embedder(input, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);

    results.push({
      id: `${chunk.source}#${i}`,
      title: chunk.title,
      text: chunk.text,
      source: chunk.source,
      url: chunk.url,
      embedding,
    });

    if ((i + 1) % 5 === 0 || i === allChunks.length - 1) {
      console.log(`  Embedded ${i + 1}/${allChunks.length} chunks`);
    }
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`Wrote ${results.length} embeddings to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('Error generating embeddings:', err);
  process.exit(1);
});
