/**
 * File Data Access Layer
 */

import { getSupabaseClient } from "./client"

export interface InsertFileInput {
  repositoryId: string
  path: string
  language: string | null
  content: string
}

export async function insertFiles(
  files: InsertFileInput[]
) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("files")
    .insert(
      files.map((file) => ({
        repository_id: file.repositoryId,
        path: file.path,
        language: file.language,
        content: file.content,
      }))
    )
    .select()

  if (error) {
    throw new Error(`Failed to insert files: ${error.message}`)
  }

  return data
}
export async function getFilesByIds(fileIds: string[]) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("files")
    .select("id, path")
    .in("id", fileIds)

  if (error) {
    throw new Error(`Failed to fetch files: ${error.message}`)
  }

  return data
}


export async function findFileByName(
  repositoryId: string,
  filename: string
) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("repository_id", repositoryId)
    .ilike("path", `%${filename}%`)

  if (error || !data || data.length === 0) {
    return null
  }

  // Prefer exact filename match ignoring case
  const exactMatch = data.find((file) =>
    file.path.toLowerCase().endsWith(filename.toLowerCase())
  )

  return exactMatch ?? data[0]
}

