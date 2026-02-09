import React, { useState } from "react";
import styles from "./styles.module.css";
import useAparaviPipeline from "./useAparaviPipeline";

const NODE_LABELS = {
  sample_google: "Google Drive Source",
  parse: "Document Parser",
  preprocessor_langchain: "LangChain Chunker",
  response: "Response Output",
};

const CLASS_STYLES = {
  source: styles.source,
  data: styles.data,
  preprocessor: styles.preprocessor,
  infrastructure: styles.infrastructure,
};

const STATUS_LABELS = {
  idle: "Ready",
  validating: "Validating pipeline...",
  executing: "Starting execution...",
  polling: "Waiting for results...",
  teardown: "Collecting results...",
  done: "Complete",
  error: "Failed",
};

function PipelineFlow({ components }) {
  return (
    <div className={styles.flow}>
      {components.map((comp, i) => (
        <React.Fragment key={comp.id}>
          {i > 0 && <span className={styles.arrow}>&rarr;</span>}
          <div
            className={`${styles.node} ${CLASS_STYLES[comp.ui?.data?.class] || ""}`}
          >
            {NODE_LABELS[comp.provider] || comp.provider}
            <span className={styles.nodeLabel}>{comp.id}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

const CONFIG_CELL_LIMIT = 250;

function TruncatedCell({ text }) {
  const [showFull, setShowFull] = useState(false);
  if (text.length <= CONFIG_CELL_LIMIT) {
    return <code>{text}</code>;
  }
  return (
    <>
      <code>{showFull ? text : text.slice(0, CONFIG_CELL_LIMIT) + "…"}</code>
      <button
        className={styles.showMoreButton}
        onClick={() => setShowFull(!showFull)}
      >
        {showFull ? "Show less" : "Show more"}
      </button>
    </>
  );
}

function ConfigTable({ components }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Stage</th>
          <th>Provider</th>
          <th>Class</th>
          <th>Configuration</th>
        </tr>
      </thead>
      <tbody>
        {components.map((comp) => {
          const config = { ...comp.config };
          delete config.actions;
          const configStr = Object.keys(config).length
            ? JSON.stringify(config, null, 2)
            : "default";
          return (
            <tr key={comp.id}>
              <td>
                <code>{comp.id}</code>
              </td>
              <td>{comp.provider}</td>
              <td>{comp.ui?.data?.class || "—"}</td>
              <td>
                <TruncatedCell text={configStr} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const CONTENT_LIMIT = 2000;

function ResultCard({ doc, index }) {
  const [expanded, setExpanded] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const title =
    doc.metadata?.source || doc.metadata?.title || `Document ${index + 1}`;
  const fullContent = doc.page_content || JSON.stringify(doc, null, 2);
  const charCount = fullContent.length;
  const isTruncated = charCount > CONTENT_LIMIT && !showFull;
  const displayContent = isTruncated
    ? fullContent.slice(0, CONTENT_LIMIT)
    : fullContent;

  return (
    <div className={styles.resultCard}>
      <div className={styles.resultHeader} onClick={() => setExpanded(!expanded)}>
        <span className={styles.resultTitle}>
          {expanded ? "▾" : "▸"} {title}
        </span>
        <span className={styles.resultMeta}>{charCount.toLocaleString()} chars</span>
      </div>
      {expanded && (
        <div className={styles.resultBody}>
          {displayContent}
          {isTruncated && (
            <span className={styles.truncatedNote}>...</span>
          )}
          {charCount > CONTENT_LIMIT && (
            <button
              className={styles.showMoreButton}
              onClick={() => setShowFull(!showFull)}
            >
              {showFull ? "Show less" : `Show all (${charCount.toLocaleString()} chars)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ status }) {
  const isActive = !["idle", "done", "error"].includes(status);
  return (
    <div className={`${styles.statusBar} ${isActive ? styles.statusActive : ""} ${status === "error" ? styles.statusError : ""} ${status === "done" ? styles.statusDone : ""}`}>
      {isActive && <span className={styles.spinner} />}
      {STATUS_LABELS[status] || status}
    </div>
  );
}

export default function PipelineResults({ config, results: staticResults }) {
  const pipeline = config || {};
  const components = pipeline.components || [];
  const { status, results: liveResults, error, running, executePipeline, cancel } = useAparaviPipeline();

  const results = liveResults || staticResults;
  const documents = results?.documents || results?.results || [];

  return (
    <div className={styles.container}>
      <h3>Pipeline Flow</h3>
      <PipelineFlow components={components} />

      <h3>Stage Configuration</h3>
      <div className={styles.configSection}>
        <ConfigTable components={components} />
      </div>

      <div className={styles.executeSection}>
        {running ? (
          <button className={styles.cancelButton} onClick={cancel}>
            Cancel
          </button>
        ) : (
          <button
            className={styles.executeButton}
            onClick={() => executePipeline(config)}
            disabled={status === "done" && !!liveResults}
          >
            Execute Pipeline
          </button>
        )}
        {status !== "idle" && <StatusIndicator status={status} />}
        {error && <pre className={styles.errorMessage}>{error}</pre>}
      </div>

      <h3>
        Execution Results
        {results && (
          <span className={documents.length ? styles.badgeSuccess : styles.badgeError}>
            {documents.length ? `${documents.length} documents` : "no output"}
          </span>
        )}
      </h3>
      <div className={styles.resultsSection}>
        {!results ? (
          <div className={styles.noResults}>
            No results yet. Click <strong>Execute Pipeline</strong> above to run
            the pipeline, or run <code>python scripts/run_pipeline.py</code> offline.
          </div>
        ) : documents.length > 0 ? (
          documents.map((doc, i) => <ResultCard key={i} doc={doc} index={i} />)
        ) : (
          <div className={styles.noResults}>
            Pipeline executed but returned no documents. Check the raw results
            below.
          </div>
        )}
      </div>

      {results && !documents.length && (
        <>
          <h3>Raw Results</h3>
          <pre className={styles.resultBody}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
