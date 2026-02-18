/**
 * Build-time script: collects docs, strips markdown, generates search index JSON.
 * Output: static/search-index.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { glob } from 'glob';
import { basename, dirname, join, relative } from 'path';

const DOCS_DIR = 'docs';
const OUTPUT = 'static/search-index.json';

function extractTitle(content, filePath) {
  // Try frontmatter title first
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const titleMatch = fmMatch[1].match(/^title:\s*(.+)$/m);
    if (titleMatch) return titleMatch[1].trim().replace(/^['"]|['"]$/g, '');
  }
  // Fall back to first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  // Fall back to filename
  return basename(filePath, filePath.endsWith('.mdx') ? '.mdx' : '.md');
}

function stripMarkdown(content) {
  return (
    content
      // Remove frontmatter
      .replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '')
      // Remove MDX import statements
      .replace(/^import\s+.+$/gm, '')
      // Remove JSX/MDX components (self-closing and paired)
      .replace(/<[A-Z][^>]*\/>/g, '')
      .replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove images
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      // Convert links to just text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Remove headings markers but keep text
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/(\*{1,3}|_{1,3})([^*_]+)\1/g, '$2')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // Remove table separator rows
      .replace(/^\|[-| :]+\|\s*$/gm, '')
      // Remove table pipe characters
      .replace(/\|/g, ' ')
      // Collapse whitespace
      .replace(/\n{2,}/g, '\n')
      .trim()
  );
}

function fileToUrl(filePath) {
  // docs/intro.md -> /docs/intro
  // docs/notebooks/04-live-code-demo.mdx -> /docs/notebooks/04-live-code-demo
  const rel = relative('.', filePath).replace(/\\/g, '/');
  return '/' + rel.replace(/\.(mdx?|md)$/, '');
}

async function main() {
  const files = await glob(`${DOCS_DIR}/**/*.{md,mdx}`);
  files.sort();

  const index = files.map((filePath, id) => {
    const content = readFileSync(filePath, 'utf-8');
    return {
      id,
      title: extractTitle(content, filePath),
      url: fileToUrl(filePath),
      body: stripMarkdown(content),
    };
  });

  mkdirSync('static', { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(index, null, 2));
  console.log(`Search index: ${index.length} docs -> ${OUTPUT}`);
  index.forEach((doc) => console.log(`  ${doc.url} — "${doc.title}"`));
}

main();
