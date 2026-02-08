import { TypeScriptParser } from './astParser'

const sampleCode = `
/**
 * Sample class for testing
 */
export class CodeRagTool {
  name = "code-rag"
  
  /**
   * Executes the tool
   */
  async execute(input: ToolInput): Promise<ToolOutput> {
    console.log("Executing...")
    return { success: true }
  }
}

export function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.resolve([[1, 2, 3]])
}

export interface ToolInput {
  query: string
  repositoryId: string
}
`

const parser = new TypeScriptParser()
const result = parser.parse('test.ts', sampleCode)

console.log(JSON.stringify(result.symbols, null, 2))