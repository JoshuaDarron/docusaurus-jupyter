import { useState, useCallback, useRef } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useEmbeddings from './useEmbeddings';

const MAX_HISTORY = 10;

function buildSystemPrompt(chunks) {
  const context = chunks
    .map((c) => `### ${c.title}\nSource: ${c.url}\n\n${c.text}`)
    .join('\n\n---\n\n');

  return `You are a helpful documentation assistant for the AI Pipeline Docs site. Answer user questions based on the documentation context provided below. Be concise and accurate. If the context doesn't contain enough information to answer, say so. When relevant, reference which doc page the information comes from.

## Documentation Context

${context}`;
}

export default function useChatbot() {
  const { siteConfig } = useDocusaurusContext();
  const apiKey = siteConfig.customFields?.ANTHROPIC_API_KEY || '';
  const apiKeyConfigured = Boolean(apiKey);

  const { loading: embeddingsLoading, ready: embeddingsReady, initialize, search } = useEmbeddings();

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
        // Initialize embeddings on first message
        if (!embeddingsReady) {
          await initialize();
        }

        // Search for relevant context
        const chunks = await search(text);

        // Build messages for Claude API with sliding window
        const systemPrompt = buildSystemPrompt(chunks);
        const history = [...messages, userMessage].slice(-MAX_HISTORY);
        const apiMessages = history.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Add placeholder for assistant response
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        // Call Claude API with streaming
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1024,
            system: systemPrompt,
            messages: apiMessages,
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API error ${response.status}: ${errText}`);
        }

        // Process SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              if (
                event.type === 'content_block_delta' &&
                event.delta?.type === 'text_delta'
              ) {
                assistantContent += event.delta.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          // User cancelled — keep partial response
        } else {
          setError(err.message);
          // Remove the empty assistant placeholder on error
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
    [apiKey, apiKeyConfigured, messages, embeddingsReady, initialize, search],
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
    embeddingsLoading,
    sendMessage,
    cancel,
    clearChat,
    apiKeyConfigured,
  };
}
