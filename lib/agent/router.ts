import { Tool } from "./types"
import { CodeRagTool } from "../tools/codeRag.tool"
import { FileSearchTool } from "../tools/fileSearch.tool"
import { TestGeneratorTool } from "../tools/testGenerator.tool"
import { ListFilesTool } from "../tools/ListFilesTool"
import { FileExplainTool } from "../tools/FileExplainTool"
import { SymbolExplainTool } from "../tools/symbolExplain.tool"
import { classifyIntent } from "./intentClassifier"

const toolRegistry: Record<string, Tool> = {
  "code-rag": new CodeRagTool(),
  "file-search": new FileSearchTool(),
  "test-generator": new TestGeneratorTool(),
  "list-files": new ListFilesTool(),
  "file-explain": new FileExplainTool(),
  "symbol-explain": new SymbolExplainTool(),
}

export async function routeToTool(query: string): Promise<{
  tool: Tool
  intent: any
}> {
  console.log(`\n🤔 Classifying query: "${query}"`)

  // Use LLM to classify intent
  const intent = await classifyIntent(query)

  console.log(`✅ Intent: ${intent.intentType} (confidence: ${intent.confidence})`)
  console.log(`   Entities:`, intent.entities)
  console.log(`   Reasoning: ${intent.reasoning}\n`)

  // Map intent to tool
  const toolMap: Record<string, string> = {
    'list_files': 'list-files',
    'explain_symbol': 'symbol-explain',
    'find_definition': 'symbol-explain', // Same tool, different query style
    'explain_file': 'file-explain',
    'find_files': 'file-search',
    'generate_tests': 'test-generator',
    'explain_concept': 'code-rag', // Semantic RAG for high-level questions
  }

  const toolKey = toolMap[intent.intentType] || 'code-rag'
  const tool = toolRegistry[toolKey]

  return { tool, intent }
}