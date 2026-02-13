import { useState, useCallback, useRef, useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { AparaviClient, Question } from 'aparavi-client';
import ragPipeline from '../../../pipelines/rag-pipeline.json';

export default function useChatbot() {
  const { siteConfig } = useDocusaurusContext();
  const apiKey = siteConfig.customFields?.APARAVI_API_KEY || '';
  const uri = siteConfig.customFields?.APARAVI_URI || 'wss://dtc.aparavi.com:443';
  const apiKeyConfigured = Boolean(apiKey);

  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const clientRef = useRef(null);
  const tokenRef = useRef(null);

  // Lazy-init: connect + start pipeline on first use
  async function ensureClient() {
    if (clientRef.current && tokenRef.current) return;

    setConnecting(true);
    try {
      const client = new AparaviClient({ auth: apiKey, uri });
      await client.connect();

      const { token } = await client.use({
        pipeline: { components: ragPipeline.components },
      });

      clientRef.current = client;
      tokenRef.current = token;
    } catch (err) {
      // Clean up on failure
      if (clientRef.current) {
        try { await clientRef.current.disconnect(); } catch {}
      }
      clientRef.current = null;
      tokenRef.current = null;
      throw err;
    } finally {
      setConnecting(false);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const client = clientRef.current;
      const token = tokenRef.current;
      if (client) {
        (async () => {
          try { if (token) await client.terminate(token); } catch {}
          try { await client.disconnect(); } catch {}
        })();
      }
      clientRef.current = null;
      tokenRef.current = null;
    };
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !apiKeyConfigured) return;

      const userMessage = { role: 'user', content: text.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setError(null);
      setStreaming(true);

      try {
        await ensureClient();

        const question = new Question();
        question.addQuestion(text.trim());

        // Include recent chat history for context
        const history = messages.slice(-10);
        for (const msg of history) {
          question.addHistory({ role: msg.role, content: msg.content });
        }

        // Add placeholder for assistant response
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        const result = await clientRef.current.chat({
          token: tokenRef.current,
          question,
        });

        // Extract answer from pipeline result
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
        setError(err.message);
        // Remove empty assistant placeholder on error
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setStreaming(false);
      }
    },
    [apiKey, apiKeyConfigured, messages],
  );

  const cancel = useCallback(() => {
    // WebSocket-based chat doesn't support mid-request cancellation
    // but we can still reset the streaming state
    setStreaming(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    streaming,
    connecting,
    error,
    sendMessage,
    cancel,
    clearChat,
    apiKeyConfigured,
  };
}

function extractAnswer(result) {
  if (!result) return 'No response received.';

  // Look for answer fields via result_types
  if (result.result_types) {
    for (const [field, type] of Object.entries(result.result_types)) {
      if (type === 'answers' && result[field]) {
        const val = result[field];
        return Array.isArray(val) ? val.join('\n') : String(val);
      }
    }
  }

  // Fallback: check common field names
  for (const key of ['answers', 'text', 'output', 'content', 'result']) {
    if (result[key]) {
      const val = result[key];
      return Array.isArray(val) ? val.join('\n') : String(val);
    }
  }

  return 'No response received.';
}
