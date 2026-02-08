/**
 * LLM-based Intent Classifier
 * Determines which tool to use based on query intent
 */

import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type IntentType =
  | 'list_files'          // "show me all files"
  | 'explain_symbol'      // "explain the execute method"
  | 'find_definition'     // "where is generateEmbeddings defined"
  | 'explain_file'        // "explain auth.service.ts"
  | 'find_files'          // "find files that handle authentication"
  | 'generate_tests'      // "write tests for auth.ts"
  | 'explain_concept'     // "how does authentication work in this app"

export interface QueryIntent {
  intentType: IntentType
  entities: {
    symbolName?: string      // Extracted: "execute", "generateEmbeddings"
    fileName?: string         // Extracted: "auth.service.ts"
    conceptKeywords?: string[] // Extracted: ["authentication", "JWT"]
  }
  reasoning: string          // Why this intent was chosen
  confidence: number         // 0-1
}

export async function classifyIntent(query: string): Promise<QueryIntent> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a code query intent classifier. Analyze the user's query about a codebase and return JSON.

**Intent Types:**

1. **list_files**: User wants to see all files in the repository
   - Examples: "list all files", "show me the files", "what files are there"

2. **explain_symbol**: User wants explanation of a specific function/class/method/interface
   - Examples: "explain the execute method", "what does generateEmbeddings do", "tell me about CodeRagTool"
   - MUST extract symbolName

3. **find_definition**: User wants to locate where something is defined
   - Examples: "where is generateEmbeddings defined", "find the definition of execute", "locate CodeRagTool"
   - MUST extract symbolName

4. **explain_file**: User wants explanation of an entire file
   - Examples: "explain auth.service.ts", "what does router.ts do", "summarize index.tsx"
   - MUST extract fileName (with extension)

5. **find_files**: User wants to find files related to a topic/feature
   - Examples: "find files that handle authentication", "which files deal with embeddings", "show me routing files"
   - MUST extract conceptKeywords

6. **generate_tests**: User wants to generate unit tests
   - Examples: "write tests for auth.ts", "generate jest tests", "create unit tests for login function"
   - May extract fileName or symbolName

7. **explain_concept**: User wants high-level explanation of how something works
   - Examples: "how does authentication work", "explain the architecture", "how do embeddings get generated"
   - MUST extract conceptKeywords

**Rules:**
- If query mentions a specific symbol name (camelCase/PascalCase), it's likely explain_symbol or find_definition
- If query has a file extension (.ts, .js, etc.), it's likely explain_file
- Keywords "where is", "find definition", "locate" → find_definition
- Keywords "explain", "what does", "how does" + symbol name → explain_symbol
- Keywords "find files", "which files" → find_files
- Keywords "test", "jest", "unit test" → generate_tests
- Abstract/architectural questions → explain_concept

Return JSON:
{
  "intentType": "explain_symbol",
  "entities": {
    "symbolName": "execute",
    "fileName": null,
    "conceptKeywords": null
  },
  "reasoning": "User asked 'what does' about a specific camelCase symbol",
  "confidence": 0.95
}`,
      },
      {
        role: "user",
        content: `Classify this query: "${query}"`,
      },
    ],
  })

  const result = JSON.parse(response.choices[0].message.content || "{}")

  return {
    intentType: result.intentType,
    entities: {
      symbolName: result.entities?.symbolName || undefined,
      fileName: result.entities?.fileName || undefined,
      conceptKeywords: result.entities?.conceptKeywords || undefined,
    },
    reasoning: result.reasoning || "No reasoning provided",
    confidence: result.confidence || 0.5,
  }
}