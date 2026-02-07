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

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (!texts.length) return []

  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)

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
