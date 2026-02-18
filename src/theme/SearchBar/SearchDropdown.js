import React from 'react';
import Link from '@docusaurus/Link';
import Markdown from 'react-markdown';
import styles from './styles.module.css';

function snippetFromBody(body, query) {
  const lower = body.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return body.slice(0, 120) + '...';
  const start = Math.max(0, idx - 50);
  const end = Math.min(body.length, idx + query.length + 70);
  let snippet = body.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < body.length) snippet = snippet + '...';
  return snippet;
}

function KeywordResults({ results, query, onSelect }) {
  if (results.length === 0) {
    return <div className={styles.noResults}>No results found.</div>;
  }
  return (
    <ul className={styles.resultList}>
      {results.map((doc) => (
        <li key={doc.id} className={styles.resultItem}>
          <Link to={doc.url} className={styles.resultLink} onClick={onSelect}>
            <span className={styles.resultTitle}>{doc.title}</span>
            <span className={styles.resultSnippet}>
              {snippetFromBody(doc.body, query)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AiAnswer({ answer, loading, error }) {
  if (loading) {
    return <div className={styles.aiLoading}>Thinking...</div>;
  }
  if (error) {
    return <div className={styles.aiError}>{error}</div>;
  }
  if (!answer) return null;
  return (
    <div className={styles.aiAnswer}>
      <Markdown>{answer}</Markdown>
    </div>
  );
}

export default function SearchDropdown({ mode, query, keywordResults, aiAnswer, aiLoading, aiError, onSelect }) {
  if (mode === 'keyword') {
    return <KeywordResults results={keywordResults} query={query} onSelect={onSelect} />;
  }
  return <AiAnswer answer={aiAnswer} loading={aiLoading} error={aiError} />;
}
