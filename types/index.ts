/**
 * Core type definitions for Agentic Codebase Copilot
 */

export interface Repository {
  id: string
  name: string
  url: string
  uploadedAt: Date
  // TODO: Add more repository metadata
}

export interface File {
  id: string
  repositoryId: string
  path: string
  name: string
  content: string
  language: string
  // TODO: Add file metadata (size, hash, etc.)
}

export interface CodeChunk {
  id: string
  fileId: string
  content: string
  startLine: number
  endLine: number
  embedding?: number[]
  // TODO: Add embedding metadata
}

export interface ToolInput {
  type: string
  payload: Record<string, unknown>
  // TODO: Add input validation metadata
}

export interface ToolOutput {
  success: boolean
  data?: unknown
  error?: string
  metadata?: Record<string, unknown>
}

export interface EmbeddingResult {
  id: string
  vector: number[]
  // TODO: Add embedding metadata
}
