import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import useChatbot from './useChatbot';
import styles from './styles.module.css';

export default function ChatPanel({ onClose }) {
  const {
    messages,
    streaming,
    error,
    embeddingsLoading,
    sendMessage,
    cancel,
    clearChat,
    apiKeyConfigured,
  } = useChatbot();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    sendMessage(input);
    setInput('');
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Docs Assistant</span>
        <div className={styles.headerActions}>
          <button
            className={styles.headerButton}
            onClick={clearChat}
            title="Clear chat"
            aria-label="Clear chat"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
            </svg>
          </button>
          <button
            className={styles.headerButton}
            onClick={onClose}
            title="Close"
            aria-label="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && !embeddingsLoading && (
          <div className={styles.placeholder}>
            Ask a question about the documentation.
          </div>
        )}

        {embeddingsLoading && (
          <div className={styles.loading}>Loading search index...</div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === 'user' ? styles.userMessage : styles.botMessage
            }
          >
            {msg.role === 'assistant' ? (
              <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        ))}

        {error && <div className={styles.error}>{error}</div>}

        <div ref={messagesEndRef} />
      </div>

      {!apiKeyConfigured && (
        <div className={styles.warning}>
          API key not configured. Add <code>ANTHROPIC_API_KEY</code> to your{' '}
          <code>.env</code> file.
        </div>
      )}

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            apiKeyConfigured
              ? 'Ask about the docs...'
              : 'API key required'
          }
          disabled={!apiKeyConfigured || embeddingsLoading}
        />
        {streaming ? (
          <button
            type="button"
            className={styles.sendButton}
            onClick={cancel}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!apiKeyConfigured || !input.trim() || embeddingsLoading}
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}
