/**
 * ML Embeddings using Hugging Face Transformers.js
 * Runs the all-MiniLM-L6-v2 sentence transformer model locally in Node.js.
 * Completely free — no API keys, no rate limits, no costs.
 *
 * The model is downloaded on first use (~30MB) and cached for subsequent runs.
 */

let pipeline: any = null;

async function getEmbeddingPipeline() {
  if (pipeline) return pipeline;

  try {
    const { pipeline: createPipeline } = await import("@huggingface/transformers");
    pipeline = await createPipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { dtype: "fp32" }
    );
    console.log("✓ ML model loaded: Xenova/all-MiniLM-L6-v2");
    return pipeline;
  } catch (error) {
    console.error("Failed to load ML model:", error);
    return null;
  }
}

/**
 * Generate a 384-dimensional embedding vector for the given text.
 * Returns null if the model fails to load.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const extractor = await getEmbeddingPipeline();
    if (!extractor) return null;

    const output = await extractor(text, { pooling: "mean", normalize: true });

    // output.data is a Float32Array — convert to regular array
    const embedding = Array.from(output.data as Float32Array);
    return embedding;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    return null;
  }
}

/**
 * Compute cosine similarity between two embedding vectors.
 * Returns a value between -1 and 1 (1 = identical, 0 = unrelated).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}
