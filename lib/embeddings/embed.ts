/**
 * Embedding Service
 * Generates embeddings using OpenAI
 */

import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const EMBEDDING_MODEL = "text-embedding-3-small"
const BATCH_SIZE = 50
const MAX_INPUT_LENGTH = 8000 // safety guard

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (!Array.isArray(texts)) {
    throw new Error("Embeddings input must be an array.")
  }

  // 🔹 Clean and validate inputs
  const cleanTexts = texts
    .filter((t) => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) =>
      t.length > MAX_INPUT_LENGTH
        ? t.slice(0, MAX_INPUT_LENGTH)
        : t
    )

  if (cleanTexts.length === 0) {
    throw new Error(
      "No valid text provided for embeddings."
    )
  }

  const allEmbeddings: number[][] = []

  for (let i = 0; i < cleanTexts.length; i += BATCH_SIZE) {
    const batch = cleanTexts.slice(i, i + BATCH_SIZE)

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    })

    const embeddings = response.data.map(
      (item) => item.embedding
    )

    allEmbeddings.push(...embeddings)
  }

  return allEmbeddings
}
