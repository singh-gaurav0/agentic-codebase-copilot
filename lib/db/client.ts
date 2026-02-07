/**
 * Supabase Database Client
 * Centralized Supabase client instance for server-side usage.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"

let supabase: SupabaseClient | null = null

/**
 * Returns a singleton Supabase client.
 * Ensures we don't create multiple instances during hot reload.
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are not set. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY."
    )
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey)

  return supabase
}

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
