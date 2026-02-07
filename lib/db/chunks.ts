/**
 * Code Chunk Data Access Layer
 */

import { getSupabaseClient } from "./client"

export interface InsertChunkInput {
  repositoryId: string
  fileId: string
  content: string
  tokenCount: number
  embedding: number[]
}

export async function insertChunks(
  chunks: InsertChunkInput[]
) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from("code_chunks")
    .insert(
      chunks.map((chunk) => ({
        repository_id: chunk.repositoryId,
        file_id: chunk.fileId,
        content: chunk.content,
        token_count: chunk.tokenCount,
        embedding: chunk.embedding,
      }))
    )

  if (error) {
    throw new Error(`Failed to insert chunks: ${error.message}`)
  }
}
/**
 * Vector similarity search using Supabase RPC
 */

export async function searchSimilarChunks(params: {
  repositoryId: string
  queryEmbedding: number[]
  matchCount: number
}) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc(
    "match_code_chunks",
    {
      query_embedding: params.queryEmbedding,
      match_repository_id: params.repositoryId,
      match_count: params.matchCount,
    }
  )

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`)
  }

  return data
}
