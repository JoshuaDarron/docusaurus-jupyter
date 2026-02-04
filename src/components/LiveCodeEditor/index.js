import React, { useState } from "react";
import usePyodide from "../LiveCode/usePyodide";
import styles from "./styles.module.css";

const DEFAULT_CODE = `# Write your Python code here
print("Hello, world!")`;

export default function LiveCodeEditor() {
  const [code, setCode] = useState(DEFAULT_CODE);
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

  function handleClear() {
    setCode("");
    setResult(null);
  }

  return (
    <div className={styles.container}>
      <textarea
        className={styles.editor}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={10}
      />
      <div className={styles.toolbar}>
        <button
          className={styles.clearButton}
          onClick={handleClear}
          disabled={busy}
        >
          Clear
        </button>
        <button
          className={styles.runButton}
          onClick={handleRun}
          disabled={busy || !code.trim()}
        >
          {buttonLabel}
        </button>
      </div>
      {result?.output && <pre className={styles.output}>{result.output}</pre>}
      {result?.errors && <pre className={styles.error}>{result.errors}</pre>}
    </div>
  );
}
