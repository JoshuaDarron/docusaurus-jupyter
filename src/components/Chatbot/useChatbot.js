import { useState, useCallback, useRef } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const WEBHOOK_URL = 'https://eaas.aparavi.com/webhook';
const WEBHOOK_PK = 'pk_b84673385c8f248a62df0c80e425010627de50a99818ed2875e2af9cacf926ef';
const WEBHOOK_TOKEN = 'ae8d2d8cd7d046b515455f2e55f6acb06397101e50e5ea4794cd5156dfc0c4cf';

export default function useChatbot() {
  const { siteConfig } = useDocusaurusContext();
  const apiKey = siteConfig.customFields?.APARAVI_API_KEY || '';
  const apiKeyConfigured = Boolean(apiKey);

  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !apiKeyConfigured) return;

      const userMessage = { role: 'user', content: text.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setError(null);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Add placeholder for assistant response
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        const response = await fetch(`${WEBHOOK_URL}?token=${WEBHOOK_TOKEN}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Authorization': WEBHOOK_PK,
          },
          body: text.trim(),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Webhook error ${response.status}: ${errText}`);
        }

        const result = await response.json();
        const answerText = extractAnswer(result);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: answerText,
          };
          return updated;
        });
      } catch (err) {
        if (err.name === 'AbortError') {
          // User cancelled — keep partial response
        } else {
          setError(err.message);
          // Remove empty assistant placeholder on error
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant' && !last.content) {
              return prev.slice(0, -1);
            }
            return prev;
          });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [apiKeyConfigured, messages],
  );

  const cancel = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    streaming,
    error,
    sendMessage,
    cancel,
    clearChat,
    apiKeyConfigured,
  };
}

function extractAnswer(result) {
  if (!result) return 'No response received.';

  if (result.status !== 'OK') {
    return `Error: ${result.status || 'Unknown error'}`;
  }

  const body = result.data?.objects?.body;
  if (!body) return 'No response received.';

  if (body.answers && body.answers.length > 0) {
    return body.answers.join('\n');
  }

  return 'No response received.';
}
