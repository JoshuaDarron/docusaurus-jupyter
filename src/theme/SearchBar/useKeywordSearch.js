import { useState, useEffect, useRef, useCallback } from 'react';

export default function useKeywordSearch() {
  const indexRef = useRef(null);
  const docsRef = useRef([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // Load search index JSON and build FlexSearch Document index
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Document } = await import('flexsearch');
        const res = await fetch('/search-index.json');
        const docs = await res.json();
        if (cancelled) return;

        docsRef.current = docs;

        const idx = new Document({
          id: 'id',
          field: ['title', 'body'],
          store: true,
          tokenize: 'forward',
        });
        docs.forEach((doc) => idx.add(doc));
        indexRef.current = idx;
      } catch (err) {
        console.error('Failed to load search index:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const search = useCallback((query) => {
    clearTimeout(timerRef.current);

    if (!query.trim() || !indexRef.current) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => {
      const raw = indexRef.current.search(query, { limit: 10, enrich: true });

      // Deduplicate results across fields
      const seen = new Set();
      const merged = [];
      for (const fieldResult of raw) {
        for (const entry of fieldResult.result) {
          if (!seen.has(entry.id)) {
            seen.add(entry.id);
            merged.push(entry.doc);
          }
        }
      }
      setResults(merged);
      setLoading(false);
    }, 150);
  }, []);

  const clear = useCallback(() => {
    clearTimeout(timerRef.current);
    setResults([]);
    setLoading(false);
  }, []);

  return { results, loading, search, clear };
}
