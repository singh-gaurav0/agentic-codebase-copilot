import { getSupabaseClient } from "./client"

export interface CreateRepositoryInput {
  name: string
  sourceType: "github" | "zip"
  sourceUrl?: string
}

export async function createOrGetRepository(
  input: CreateRepositoryInput
) {
  const supabase = getSupabaseClient()

  // 1️⃣ Check if repository already exists
  const { data: existing } = await supabase
    .from("repositories")
    .select("*")
    .eq("source_type", input.sourceType)
    .eq("source_url", input.sourceUrl)
    .single()

  if (existing) {
    return {
      repository: existing,
      alreadyIndexed: true,
    }
  }

  // 2️⃣ Insert new repository
  const { data, error } = await supabase
    .from("repositories")
    .insert({
      name: input.name,
      source_type: input.sourceType,
      source_url: input.sourceUrl ?? null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(
      `Failed to create repository: ${error.message}`
    )
  }

  return {
    repository: data,
    alreadyIndexed: false,
  }
}

export async function getAllRepositories() {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("repositories")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(
      `Failed to fetch repositories: ${error.message}`
    )
  }

  return data
}
