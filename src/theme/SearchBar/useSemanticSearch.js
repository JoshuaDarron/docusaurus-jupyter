import { useState, useCallback, useRef } from 'react';
import { WEBHOOK_URL, WEBHOOK_PK, WEBHOOK_TOKEN } from '@site/src/lib/webhook';

function extractAnswer(result) {
  if (!result) return 'No response received.';
  if (result.status !== 'OK') return `Error: ${result.status || 'Unknown error'}`;
  const body = result.data?.objects?.body;
  if (!body) return 'No response received.';
  if (body.answers && body.answers.length > 0) return body.answers.join('\n');
  return 'No response received.';
}

export default function useSemanticSearch() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const search = useCallback(async (query) => {
    if (!query.trim()) return;

    setAnswer('');
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${WEBHOOK_URL}?token=${WEBHOOK_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Authorization: WEBHOOK_PK,
        },
        body: query.trim(),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Webhook error ${response.status}: ${errText}`);
      }

      const result = await response.json();
      setAnswer(extractAnswer(result));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const clear = useCallback(() => {
    setAnswer('');
    setError(null);
    setLoading(false);
  }, []);

  return { answer, loading, error, search, cancel, clear };
}
