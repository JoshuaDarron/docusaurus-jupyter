import React, { useState, useCallback } from "react";
import PipelineResults from "../PipelineResults";
import styles from "./styles.module.css";

export default function PipelineEditor({ defaultConfig, apiKey, baseUrl }) {
  const defaultJson = JSON.stringify(defaultConfig, null, 2);
  const [jsonText, setJsonText] = useState(defaultJson);
  const [parsedConfig, setParsedConfig] = useState(defaultConfig);
  const [parseError, setParseError] = useState(null);
  const [dirty, setDirty] = useState(false);

  const handleChange = useCallback((e) => {
    setJsonText(e.target.value);
    setDirty(true);
    setParseError(null);
  }, []);

  const handleLoad = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.components || !Array.isArray(parsed.components)) {
        setParseError(
          'Invalid pipeline: missing "components" array. The pipeline JSON must contain a "components" array of stage definitions.'
        );
        return;
      }
      setParsedConfig(parsed);
      setParseError(null);
      setDirty(false);
    } catch (err) {
      setParseError(`Invalid JSON: ${err.message}`);
    }
  }, [jsonText]);

  const handleReset = useCallback(() => {
    setJsonText(defaultJson);
    setParsedConfig(defaultConfig);
    setParseError(null);
    setDirty(false);
  }, [defaultJson, defaultConfig]);

  return (
    <div className={styles.container}>
      <div className={styles.editorSection}>
        <div className={styles.editorHeader}>
          <h3 className={styles.editorTitle}>Pipeline Configuration (JSON)</h3>
          {dirty && <span className={styles.dirtyBadge}>Modified</span>}
        </div>
        <textarea
          className={`${styles.editor} ${parseError ? styles.editorError : ""}`}
          value={jsonText}
          onChange={handleChange}
          spellCheck={false}
          rows={20}
        />
        {parseError && <div className={styles.error}>{parseError}</div>}
        <div className={styles.toolbar}>
          <button className={styles.resetButton} onClick={handleReset}>
            Reset to Default
          </button>
          <button
            className={styles.loadButton}
            onClick={handleLoad}
            disabled={!dirty}
          >
            {dirty ? "Load Pipeline" : "Pipeline Loaded"}
          </button>
        </div>
      </div>

      <PipelineResults config={parsedConfig} apiKey={apiKey} baseUrl={baseUrl} />
    </div>
  );
}
