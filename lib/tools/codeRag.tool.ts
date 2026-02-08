/**
 * Code RAG Tool
 * Retrieves relevant chunks and generates explanation
 */

import { Tool, ToolInput, ToolOutput } from "../agent/types"
import { generateEmbeddings } from "../embeddings/embed"
import { searchSimilarChunks } from "../db/chunks"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 🔹 Calibrated thresholds
const MIN_SIMILARITY = 0.3
const IDEAL_SIMILARITY = 0.6
const MAX_CONTEXT_CHUNKS = 3

export class CodeRagTool implements Tool {
  name = "code-rag"
  description = "Explains code using vector retrieval"

  async execute(input: ToolInput): Promise<ToolOutput> {
    if (!input.query?.trim()) {
      return {
        success: false,
        message: "Query cannot be empty.",
      }
    }

    const [queryEmbedding] = await generateEmbeddings([
      input.query,
    ])

    const matches = await searchSimilarChunks({
      repositoryId: input.repositoryId,
      queryEmbedding,
      matchCount: 6,
    })

    if (!matches || matches.length === 0) {
      return {
        success: false,
        message: "No code found in this repository.",
      }
    }

    // Sort by similarity (highest first)
    const sortedMatches = matches.sort(
      (a: any, b: any) => b.similarity - a.similarity
    )

    const topMatch = sortedMatches[0]

    // 🔹 Hard reject only if similarity is extremely low
    if (topMatch.similarity < MIN_SIMILARITY) {
      return {
        success: false,
        message:
          "This question does not appear related to the repository.",
      }
    }

    // 🔹 Select context intelligently
    const relevantMatches =
      topMatch.similarity >= IDEAL_SIMILARITY
        ? sortedMatches.slice(0, MAX_CONTEXT_CHUNKS)
        : [topMatch]

    const context = relevantMatches
      .map((m: any) => m.content)
      .join("\n\n---\n\n")

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior software engineer. Answer ONLY using the provided context. If the context does not contain relevant information, respond with: 'The requested logic does not exist in this repository.' Do NOT invent new code.",
        },
        {
          role: "user",
          content: `
Context:
${context}

Question:
${input.query}

Explain clearly.
`,
        },
      ],
      temperature: 0.2,
    })

    return {
      success: true,
      answer: response.choices[0].message.content,
    }
  }
}
