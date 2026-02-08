/**
 * Symbol Explain Tool
 * Explains a specific symbol (function, class, method) by name
 */

import { Tool, ToolInput, ToolOutput } from "../agent/types"
import { findSymbolByName } from "../db/symbols"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class SymbolExplainTool implements Tool {
  name = "symbol-explain"
  description = "Explains a specific symbol (function, class, method) by name"

  async execute(input: ToolInput): Promise<ToolOutput> {
    if (!input.query?.trim()) {
      return {
        success: false,
        message: "Query cannot be empty.",
      }
    }

    // Extract symbol name from query
    // Examples:
    // "explain the execute method"
    // "what does generateEmbeddings do"
    // "tell me about CodeRagTool"
    
    const symbolName = input.entities?.symbolName || this.extractSymbolName(input.query)

    if (!symbolName) {
      return {
        success: false,
        message: "Could not identify a symbol name in your query. Try: 'explain the execute method' or 'what does generateEmbeddings do?'",
      }
    }

    console.log(`🔍 Looking for symbol: ${symbolName}`)

    // Find symbol in database
    const symbol = await findSymbolByName(input.repositoryId, symbolName)

    if (!symbol) {
      return {
        success: false,
        message: `Symbol '${symbolName}' not found in this repository.`,
      }
    }

    console.log(`✅ Found ${symbol.type}: ${symbol.name} in ${symbol.file.path}`)

    // Generate focused explanation
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are a senior software engineer. Explain ONLY this specific code symbol. 
Do not summarize the entire file. Focus exclusively on what this ${symbol.type} does, its purpose, and how it works.
Be concise but thorough.`,
        },
        {
          role: "user",
          content: `
Symbol: ${symbol.name} (${symbol.type})
${symbol.signature ? `Signature: ${symbol.signature}` : ''}
Location: ${symbol.file.path}:${symbol.startLine}-${symbol.endLine}

${symbol.docstring ? `Documentation:\n${symbol.docstring}\n\n` : ''}

Code:
\`\`\`${symbol.file.language}
${symbol.content}
\`\`\`

Explain what this ${symbol.type} does.
`,
        },
      ],
    })

    return {
      success: true,
      answer: response.choices[0].message.content,
      metadata: {
        symbolName: symbol.name,
        symbolType: symbol.type,
        filePath: symbol.file.path,
        location: `${symbol.file.path}:${symbol.startLine}`,
      },
    }
  }

  // Helper: Extract symbol name from natural language query
  private extractSymbolName(query: string): string | null {
    const lowerQuery = query.toLowerCase()

    // Pattern 1: "explain the [symbolName] method/function/class"
    let match = lowerQuery.match(/(?:explain|what does|tell me about|describe)(?: the)? (\w+)/i)
    if (match) return match[1]

    // Pattern 2: "how does [symbolName] work"
    match = lowerQuery.match(/how does (\w+) work/i)
    if (match) return match[1]

    // Pattern 3: Just the symbol name (if it's a single word query)
    const words = query.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0]
    }

    // Pattern 4: Look for camelCase or PascalCase words (likely symbol names)
    const camelCaseMatch = query.match(/\b([a-z]+[A-Z]\w+|[A-Z][a-z]+[A-Z]\w+)\b/)
    if (camelCaseMatch) return camelCaseMatch[1]

    return null
  }
}