/**
 * File Search Tool
 * Finds most relevant files using vector similarity
 */

import { Tool, ToolInput, ToolOutput } from "../agent/types"
import { generateEmbeddings } from "../embeddings/embed"
import { searchSimilarChunks } from "../db/chunks"
import { getFilesByIds } from "../db/files"

export class FileSearchTool implements Tool {
  name = "file-search"
  description = "Finds relevant files using semantic search"

  async execute(input: ToolInput): Promise<ToolOutput> {
    // 1️⃣ Embed query
    const [queryEmbedding] = await generateEmbeddings([
      input.query,
    ])

    // 2️⃣ Retrieve similar chunks
    const matches = await searchSimilarChunks({
      repositoryId: input.repositoryId,
      queryEmbedding,
      matchCount: 10,
    })

    if (!matches || matches.length === 0) {
      return {
        success: false,
        message: "No relevant files found.",
      }
    }

    // 3️⃣ Aggregate by file_id
    const fileScores = new Map<
      string,
      { count: number; similaritySum: number }
    >()

    for (const match of matches as any[]) {
      const fileId = match.file_id

      if (!fileScores.has(fileId)) {
        fileScores.set(fileId, {
          count: 0,
          similaritySum: 0,
        })
      }

      const current = fileScores.get(fileId)!
      current.count += 1
      current.similaritySum += match.similarity
    }

    // 4️⃣ Rank files
    const ranked = Array.from(fileScores.entries())
      .map(([fileId, stats]) => ({
        fileId,
        score: stats.similaritySum / stats.count,
      }))
      .sort((a, b) => b.score - a.score)

      const topResults = ranked.slice(0, 5)

      const fileIds = topResults.map(r => r.fileId)
      
      const files = await getFilesByIds(fileIds)
      
      const formatted = topResults.map(result => {
        const file = files.find(f => f.id === result.fileId)
      
        return {
          path: file?.path ?? "unknown",
          score: result.score,
        }
      })
      
      return {
        success: true,
        answer: JSON.stringify(formatted, null, 2),
      }
  }
}
