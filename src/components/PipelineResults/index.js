import React, { useState } from "react";
import styles from "./styles.module.css";

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
                <code>{configStr}</code>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ResultCard({ doc, index }) {
  const [expanded, setExpanded] = useState(false);
  const title =
    doc.metadata?.source || doc.metadata?.title || `Document ${index + 1}`;
  const charCount = doc.page_content?.length || 0;

  return (
    <div className={styles.resultCard}>
      <div className={styles.resultHeader} onClick={() => setExpanded(!expanded)}>
        <span className={styles.resultTitle}>
          {expanded ? "▾" : "▸"} {title}
        </span>
        <span className={styles.resultMeta}>{charCount} chars</span>
      </div>
      {expanded && (
        <div className={styles.resultBody}>
          {doc.page_content || JSON.stringify(doc, null, 2)}
        </div>
      )}
    </div>
  );
}

export default function PipelineResults({ config, results }) {
  const pipeline = config || {};
  const components = pipeline.components || [];
  const documents = results?.documents || results?.results || [];

  return (
    <div className={styles.container}>
      <h3>Pipeline Flow</h3>
      <PipelineFlow components={components} />

      <h3>Stage Configuration</h3>
      <div className={styles.configSection}>
        <ConfigTable components={components} />
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
            No results yet. Run <code>python scripts/run_pipeline.py</code> to
            execute the pipeline.
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
