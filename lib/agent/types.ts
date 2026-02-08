/**
 * Agent and Tool interface definitions
 */



export interface Tool {
  name: string
  description: string
  execute(input: ToolInput): Promise<ToolOutput>
}

export interface ToolRegistry {
  [key: string]: Tool
}

export interface AgentContext {
  repositoryId?: string
  userId?: string
  // TODO: Add context metadata
}
export interface ToolInput {
  repositoryId: string
  query: string
  entities?: {
    symbolName?: string
    fileName?: string
    conceptKeywords?: string[]
  }
}

export interface ToolOutput {
  success: boolean
  answer?: string | null
  message?: string
  metadata?: Record<string, unknown> 
}
