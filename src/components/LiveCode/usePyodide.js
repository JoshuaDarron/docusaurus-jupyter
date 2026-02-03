import { useRef, useCallback, useState } from "react";

let pyodidePromise = null;

function loadPyodideSingleton() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js";
      document.head.appendChild(script);
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load Pyodide"));
      });
      // eslint-disable-next-line no-undef
      const pyodide = await loadPyodide();
      return pyodide;
    })();
  }
  return pyodidePromise;
}

export default function usePyodide() {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const pyodideRef = useRef(null);

  const runPython = useCallback(async (code) => {
    setLoading(true);
    try {
      if (!pyodideRef.current) {
        pyodideRef.current = await loadPyodideSingleton();
      }
      setLoading(false);
      setRunning(true);

      const pyodide = pyodideRef.current;
      pyodide.setStdout({ batched: () => {} });
      pyodide.setStderr({ batched: () => {} });

      let stdout = [];
      let stderr = [];
      pyodide.setStdout({ batched: (line) => stdout.push(line) });
      pyodide.setStderr({ batched: (line) => stderr.push(line) });

      await pyodide.runPythonAsync(code);

      const output = stdout.join("\n");
      const errors = stderr.join("\n");
      return { output, errors };
    } catch (err) {
      setLoading(false);
      return { output: "", errors: err.message };
    } finally {
      setLoading(false);
      setRunning(false);
    }
  }, []);

  return { runPython, loading, running };
}
