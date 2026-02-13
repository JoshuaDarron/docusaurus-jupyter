import { useState, useRef, useCallback } from 'react';

let modelPromise = null;

function loadModel() {
  if (!modelPromise) {
    modelPromise = import('@huggingface/transformers').then((mod) =>
      mod.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2'),
    );
  }
  return modelPromise;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  // Vectors are already normalized, so dot product = cosine similarity
  return dot;
}

export default function useEmbeddings() {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const chunksRef = useRef(null);
  const embedderRef = useRef(null);

  const initialize = useCallback(async () => {
    if (ready) return;
    setLoading(true);
    try {
      const [chunks, embedder] = await Promise.all([
        fetch('/data/doc-embeddings.json').then((r) => r.json()),
        loadModel(),
      ]);
      chunksRef.current = chunks;
      embedderRef.current = embedder;
      setReady(true);
    } finally {
      setLoading(false);
    }
  }, [ready]);

  const search = useCallback(
    async (query, topK = 4) => {
      if (!embedderRef.current || !chunksRef.current) {
        throw new Error('Embeddings not initialized');
      }

      const output = await embedderRef.current(query, {
        pooling: 'mean',
        normalize: true,
      });
      const queryEmbedding = Array.from(output.data);

      const scored = chunksRef.current.map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK);
    },
    [],
  );

  return { loading, ready, initialize, search };
}
