import { useState, useCallback, useRef } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const POLL_INTERVAL = 5000;
const MAX_POLL_ATTEMPTS = 200;

function formatError(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function wrapPipelinePayload(pipeline) {
  if (pipeline.pipeline) {
    return { pipeline: pipeline.pipeline, errors: pipeline.errors || [], warnings: pipeline.warnings || [] };
  }
  return { pipeline, errors: [], warnings: [] };
}

export default function useAparaviPipeline() {
  const { siteConfig } = useDocusaurusContext();
  const apiKey = siteConfig.customFields?.APARAVI_API_KEY || '';

  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const running = !['idle', 'done', 'error'].includes(status);

  async function apiFetch(method, path, body) {
    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api/aparavi${path}`, opts);
    const json = await res.json();
    if (res.status === 401) throw new Error('Authentication failed. Check your API key.');
    if (res.status >= 400) throw new Error(formatError(json.error) || `API error ${res.status}`);
    return json;
  }

  const executePipeline = useCallback(async (pipelineConfig) => {
    if (!apiKey) {
      setError('APARAVI_API_KEY is not configured. Add it to your .env file and restart the dev server.');
      setStatus('error');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setResults(null);

    try {
      // Step 1: Validate
      setStatus('validating');
      const payload = wrapPipelinePayload(pipelineConfig);
      const validateRes = await apiFetch('POST', '/pipe/validate', payload);
      if (validateRes.status === 'Error') {
        throw new Error(`Validation failed: ${formatError(validateRes.error) || 'unknown error'}`);
      }

      // Step 2: Execute
      setStatus('executing');
      const execRes = await apiFetch('PUT', '/task?name=my-task', payload);
      if (execRes.status !== 'OK' || !execRes.data) {
        throw new Error(`Execution failed: ${formatError(execRes.error) || 'no task data returned'}`);
      }
      const { token, type: taskType } = execRes.data;

      // Step 3: Poll for completion
      setStatus('polling');
      let pollResult;
      for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
        if (controller.signal.aborted) throw new Error('Cancelled');
        pollResult = await apiFetch('GET', `/task?token=${encodeURIComponent(token)}&type=${encodeURIComponent(taskType)}`);
        const taskStatus = pollResult.data?.status;
        if (taskStatus === 'Completed' || taskStatus === 'Done') break;
        if (taskStatus === 'Error' || taskStatus === 'Failed') {
          throw new Error(`Pipeline failed: ${formatError(pollResult.error) || formatError(pollResult.data?.error) || 'unknown error'}`);
        }
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
      }

      // Step 4: Teardown
      setStatus('teardown');
      const teardownRes = await apiFetch('DELETE', `/task?token=${encodeURIComponent(token)}&type=${encodeURIComponent(taskType)}`);

      // Use teardown response data if available, fall back to poll data
      const resultData = teardownRes.data || pollResult?.data;
      setResults(resultData);
      setStatus('done');
    } catch (err) {
      if (err.message !== 'Cancelled') {
        setError(err.message);
        setStatus('error');
      } else {
        setStatus('idle');
      }
    } finally {
      abortRef.current = null;
    }
  }, [apiKey]);

  const cancel = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return { status, results, error, running, executePipeline, cancel };
}
