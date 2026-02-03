import React, { useState } from "react";
import usePyodide from "./usePyodide";
import styles from "./styles.module.css";

export default function LiveCode({ children }) {
  const code = typeof children === "string" ? children.trim() : "";
  const { runPython, loading, running } = usePyodide();
  const [result, setResult] = useState(null);

  const busy = loading || running;

  let buttonLabel = "Run";
  if (loading) buttonLabel = "Loading Pyodide\u2026";
  if (running) buttonLabel = "Running\u2026";

  async function handleRun() {
    const { output, errors } = await runPython(code);
    setResult({ output, errors });
  }

  return (
    <div className={styles.container}>
      <pre className={styles.codeBlock}>
        <code>{code}</code>
      </pre>
      <div className={styles.toolbar}>
        <button
          className={styles.runButton}
          onClick={handleRun}
          disabled={busy}
        >
          {buttonLabel}
        </button>
      </div>
      {result?.output && <pre className={styles.output}>{result.output}</pre>}
      {result?.errors && <pre className={styles.error}>{result.errors}</pre>}
    </div>
  );
}
