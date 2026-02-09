/**
 * Code RAG Tool
 * Retrieves relevant chunks and generates explanation
 */

import { Tool, ToolInput, ToolOutput } from "../agent/types"
import { generateEmbeddings } from "../embeddings/embed"
import { searchSimilarChunks } from "../db/chunks"
import { getSupabaseClient } from "../db/client"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 🔹 Calibrated thresholds
const MIN_SIMILARITY = 0.25 // Lowered from 0.3 for broader questions
const IDEAL_SIMILARITY = 0.6
const MAX_CONTEXT_CHUNKS = 5 // Increased from 3 for better context

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

    // Special handling for repository-level questions
    const isRepoLevelQuery = this.isRepositoryLevelQuery(input.query)

    if (isRepoLevelQuery) {
      return await this.handleRepositorySummary(input)
    }

    const [queryEmbedding] = await generateEmbeddings([input.query])

    const matches = await searchSimilarChunks({
      repositoryId: input.repositoryId,
      queryEmbedding,
      matchCount: 10,
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
        : sortedMatches.slice(0, 3)

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

  // Helper: Detect repository-level questions
  private isRepositoryLevelQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase()
    const repoKeywords = [
      'summary of the repo',
      'what does this repo do',
      'repository summary',
      'overview of the project',
      'what is this codebase',
      'describe the repository',
      'architecture',
      'project structure'
    ]

    return repoKeywords.some(keyword => lowerQuery.includes(keyword))
  }

  // Handler: Generate repository summary
  private async handleRepositorySummary(input: ToolInput): Promise<ToolOutput> {
    const supabase = getSupabaseClient()

    // Get all files with their symbols
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select(`
        path,
        language,
        symbols (
          name,
          type,
          is_exported
        )
      `)
      .eq('repository_id', input.repositoryId)
      .limit(50)

    if (filesError || !files) {
      return {
        success: false,
        message: "Could not retrieve repository information."
      }
    }

    // Get some sample chunks for context
    const [queryEmbedding] = await generateEmbeddings([
      "main application code architecture"
    ])

    const matches = await searchSimilarChunks({
      repositoryId: input.repositoryId,
      queryEmbedding,
      matchCount: 5,
    })

    // Build repository summary context
    const filesByLanguage = files.reduce((acc: any, file: any) => {
      if (!acc[file.language]) acc[file.language] = []
      acc[file.language].push(file.path)
      return acc
    }, {})

    const exportedSymbols = files
      .flatMap((f: any) => f.symbols || [])
      .filter((s: any) => s.is_exported)
      .slice(0, 20)

    const context = `
Repository Structure:
- Total files: ${files.length}
- Languages: ${Object.keys(filesByLanguage).join(', ')}

Key Files:
${Object.entries(filesByLanguage)
  .map(([lang, paths]: [string, any]) => 
    `${lang}: ${paths.slice(0, 5).join(', ')}${paths.length > 5 ? ` (+${paths.length - 5} more)` : ''}`
  )
  .join('\n')}

Exported Symbols:
${exportedSymbols.map((s: any) => `- ${s.type}: ${s.name}`).join('\n')}

Sample Code Context:
${matches?.map((m: any) => m.content).join('\n\n---\n\n') || 'No additional context available'}
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "You are a senior software engineer reviewing a codebase. Provide a clear, concise summary of what this repository does based on its structure and exported symbols. Focus on the main purpose, key components, and technology stack."
        },
        {
          role: "user",
          content: `
Based on this repository information:

${context}

Provide a summary of what this repository does and its key components.
`
        }
      ]
    })

    return {
      success: true,
      answer: response.choices[0].message.content,
      metadata: {
        totalFiles: files.length,
        languages: Object.keys(filesByLanguage),
        exportedSymbols: exportedSymbols.length
      }
    }
  }
}
