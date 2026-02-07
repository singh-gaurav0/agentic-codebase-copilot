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

// 🔹 Adjustable threshold
const SIMILARITY_THRESHOLD = 0.75

export class CodeRagTool implements Tool {
  name = "code-rag"
  description = "Explains code using vector retrieval"

  async execute(input: ToolInput): Promise<ToolOutput> {
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
        message: "No relevant code found.",
      }
    }

    // 🔹 Similarity threshold filtering
    const relevantMatches = matches.filter(
      (m: any) => m.similarity >= SIMILARITY_THRESHOLD
    )

    if (relevantMatches.length === 0) {
      return {
        success: false,
        message:
          "No sufficiently relevant code found in this repository.",
      }
    }

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
