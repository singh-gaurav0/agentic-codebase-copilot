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
    const [queryEmbedding] = await generateEmbeddings([input.query])

    // 2️⃣ Retrieve similar chunks (prefer symbol-level chunks for better accuracy)
    const matches = await searchSimilarChunks({
      repositoryId: input.repositoryId,
      queryEmbedding,
      matchCount: 15, // Increased to get more candidates
    })

    if (!matches || matches.length === 0) {
      return {
        success: false,
        message: "No relevant files found.",
      }
    }

    // 3️⃣ Aggregate by file_id and prioritize symbol chunks
    const fileScores = new Map<string, { 
      count: number
      similaritySum: number
      hasSymbolChunks: boolean
      topSimilarity: number
    }>()

    for (const match of matches as any[]) {
      const fileId = match.file_id
      const isSymbolChunk = match.chunk_type === 'symbol'

      if (!fileScores.has(fileId)) {
        fileScores.set(fileId, {
          count: 0,
          similaritySum: 0,
          hasSymbolChunks: false,
          topSimilarity: 0,
        })
      }

      const current = fileScores.get(fileId)!
      current.count += 1
      current.similaritySum += match.similarity
      
      // Track if we found symbol-level matches (more precise)
      if (isSymbolChunk) {
        current.hasSymbolChunks = true
      }

      // Track highest similarity score for this file
      if (match.similarity > current.topSimilarity) {
        current.topSimilarity = match.similarity
      }
    }

    // 4️⃣ Rank files (prioritize files with symbol matches)
    const ranked = Array.from(fileScores.entries())
      .map(([fileId, stats]) => ({
        fileId,
        avgScore: stats.similaritySum / stats.count,
        topScore: stats.topSimilarity,
        hasSymbols: stats.hasSymbolChunks,
        // Boost score if we found symbol-level matches
        finalScore: stats.hasSymbolChunks 
          ? stats.topSimilarity * 1.2 
          : stats.similaritySum / stats.count
      }))
      .sort((a, b) => b.finalScore - a.finalScore)

    const topResults = ranked.slice(0, 5)

    const fileIds = topResults.map(r => r.fileId)
    const files = await getFilesByIds(fileIds)

    // 5️⃣ Format as natural language response
    const fileList = topResults
    .map((result, index) => {
      const file = files.find((f: any) => f.id === result.fileId)
      if (!file) return null
  
      const confidence = result.finalScore > 0.7 
        ? "High relevance" 
        : result.finalScore > 0.5 
        ? "Moderate relevance" 
        : "Low relevance"
  
      return `${index + 1}. **${file.path}**
     - ${confidence} (score: ${result.finalScore.toFixed(3)})${result.hasSymbols ? '\n   - Contains matching symbols' : ''}`
    })
    .filter(Boolean)
    .join('\n\n')

    const answer = `Found ${topResults.length} relevant file(s):\n\n${fileList}`

    return {
      success: true,
      answer,
      metadata: {
        totalResults: topResults.length,
        files: topResults.map((r, i) => ({
          path: files.find((f: any) => f.id === r.fileId)?.path,
          score: r.finalScore,
          rank: i + 1
        }))
      }
    }
  }
}