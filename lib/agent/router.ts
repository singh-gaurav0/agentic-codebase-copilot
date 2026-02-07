import { Tool } from "./types"
import { CodeRagTool } from "../tools/codeRag.tool"
import { FileSearchTool } from "../tools/fileSearch.tool"
import { TestGeneratorTool } from "../tools/testGenerator.tool"

const toolRegistry: Record<string, Tool> = {
  "code-rag": new CodeRagTool(),
  "file-search": new FileSearchTool(),
  "test-generator": new TestGeneratorTool(),
}

export function routeToTool(query: string): Tool {
  const lowerQuery = query.toLowerCase()

  if (
    lowerQuery.includes("test") ||
    lowerQuery.includes("jest") ||
    lowerQuery.includes("unit test")
  ) {
    return toolRegistry["test-generator"]
  }

  if (
    lowerQuery.includes("find") ||
    lowerQuery.includes("where") ||
    lowerQuery.includes("search") ||
    lowerQuery.includes("file")
  ) {
    return toolRegistry["file-search"]
  }

  return toolRegistry["code-rag"]
}