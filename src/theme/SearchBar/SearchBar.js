import React, { useState, useRef, useEffect, useCallback } from 'react';
import useKeywordSearch from './useKeywordSearch';
import useSemanticSearch from './useSemanticSearch';
import SearchDropdown from './SearchDropdown';
import styles from './styles.module.css';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('keyword'); // 'keyword' | 'ai'
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const keyword = useKeywordSearch();
  const semantic = useSemanticSearch();

  // Show dropdown when there's content to show
  const hasContent =
    mode === 'keyword'
      ? query.trim().length > 0 && (keyword.results.length > 0 || keyword.loading || query.trim().length >= 2)
      : semantic.answer || semantic.loading || semantic.error;

  // Handle input changes
  const handleInput = useCallback(
    (e) => {
      const val = e.target.value;
      setQuery(val);
      setOpen(true);
      if (mode === 'keyword') {
        keyword.search(val);
      }
    },
    [mode, keyword.search],
  );

  // Handle Enter key for AI mode
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && mode === 'ai' && query.trim()) {
        e.preventDefault();
        semantic.search(query);
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    },
    [mode, query, semantic.search],
  );

  // Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    function onClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Switch modes
  const switchMode = useCallback(
    (newMode) => {
      setMode(newMode);
      keyword.clear();
      semantic.cancel();
      semantic.clear();
      setOpen(false);
      // Re-search if there's a query
      if (query.trim() && newMode === 'keyword') {
        keyword.search(query);
        setOpen(true);
      }
    },
    [query, keyword, semantic],
  );

  // Close dropdown on result select
  const handleSelect = useCallback(() => {
    setOpen(false);
    setQuery('');
    keyword.clear();
    semantic.clear();
  }, [keyword, semantic]);

  return (
    <div className={styles.searchContainer} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          className={styles.searchInput}
          type="text"
          placeholder={mode === 'keyword' ? 'Search docs...' : 'Ask AI...'}
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => hasContent && setOpen(true)}
        />
        <span className={styles.shortcut}>Ctrl+K</span>
      </div>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeButton} ${mode === 'keyword' ? styles.modeButtonActive : ''}`}
              onClick={() => switchMode('keyword')}
              type="button"
            >
              Keyword
            </button>
            <button
              className={`${styles.modeButton} ${mode === 'ai' ? styles.modeButtonActive : ''}`}
              onClick={() => switchMode('ai')}
              type="button"
            >
              AI
            </button>
          </div>
          {hasContent && (
            <SearchDropdown
              mode={mode}
              query={query}
              keywordResults={keyword.results}
              aiAnswer={semantic.answer}
              aiLoading={semantic.loading}
              aiError={semantic.error}
              onSelect={handleSelect}
            />
          )}
        </div>
      )}
    </div>
  );
}
