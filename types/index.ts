// src/types/index.ts (extend your existing types)

export interface Repository {
  id: string
  name: string
  url: string
  uploadedAt: Date
  sourceType?: 'github' | 'zip' // Match DB
}

export interface File {
  id: string
  repositoryId: string
  path: string
  name: string
  content: string
  language: string
}

// ✅ NEW: Symbol types
export interface Symbol {
  id: string
  repositoryId: string
  fileId: string
  name: string
  qualifiedName?: string // "ClassName.methodName"
  type: 'function' | 'method' | 'class' | 'interface' | 'type' | 'variable' | 'constant' | 'enum'
  startLine: number
  endLine: number
  signature?: string
  content: string
  docstring?: string
  isExported: boolean
  parentSymbolId?: string
  createdAt: Date
}

export interface SymbolReference {
  id: string
  symbolId: string
  fileId: string
  line: number
  columnStart?: number
  columnEnd?: number
  referenceType: 'call' | 'import' | 'type_annotation' | 'instantiation' | 'assignment'
  createdAt: Date
}

// ✅ ENHANCED: CodeChunk with new fields
export interface CodeChunk {
  id: string
  repositoryId: string // Added for completeness
  fileId: string
  content: string
  startLine: number
  endLine: number
  tokenCount?: number
  embedding?: number[]
  chunkType: 'symbol' | 'file' | 'block' // NEW
  symbolId?: string // NEW - links to symbols table
  metadata?: Record<string, unknown> // NEW
  createdAt: Date
}

export interface FileDependency {
  id: string
  repositoryId: string
  fromFileId: string
  toFileId: string
  importName?: string
  importType?: 'default' | 'named' | 'namespace' | 'dynamic'
  createdAt: Date
}

// ✅ Tool interfaces remain the same
export interface ToolInput {
  repositoryId: string
  query: string
  entities?: QueryEntities // NEW - from intent classifier
}

export interface QueryEntities {
  symbolName?: string
  fileName?: string
  filePattern?: string
  conceptKeywords?: string[]
}

export interface ToolOutput {
  success: boolean
  answer?: string
  data?: unknown
  message?: string
  metadata?: Record<string, unknown>
}