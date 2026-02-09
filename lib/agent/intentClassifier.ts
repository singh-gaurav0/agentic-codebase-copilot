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
  try {
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

Return JSON with this exact structure:
{
  "intentType": "explain_symbol",
  "entities": {
    "symbolName": "execute",
    "fileName": null,
    "conceptKeywords": null
  },
  "reasoning": "User asked 'what does' about a specific camelCase symbol",
  "confidence": 0.95
}

IMPORTANT: Always return valid JSON. If unsure, default to "explain_concept" with confidence 0.5.`,
        },
        {
          role: "user",
          content: `Classify this query: "${query}"`,
        },
      ],
    })

    const content = response.choices[0].message.content
    
    if (!content) {
      throw new Error("Empty response from OpenAI")
    }

    const result = JSON.parse(content)

    // Validate the response structure
    if (!result.intentType) {
      console.warn("Invalid intent classification response:", result)
      return getFallbackIntent(query)
    }

    // Ensure valid intent type
    const validIntents: IntentType[] = [
      'list_files',
      'explain_symbol',
      'find_definition',
      'explain_file',
      'find_files',
      'generate_tests',
      'explain_concept'
    ]

    if (!validIntents.includes(result.intentType)) {
      console.warn(`Invalid intent type: ${result.intentType}`)
      return getFallbackIntent(query)
    }

    return {
      intentType: result.intentType as IntentType,
      entities: {
        symbolName: result.entities?.symbolName || undefined,
        fileName: result.entities?.fileName || undefined,
        conceptKeywords: result.entities?.conceptKeywords || undefined,
      },
      reasoning: result.reasoning || "No reasoning provided",
      confidence: typeof result.confidence === 'number' 
        ? Math.max(0, Math.min(1, result.confidence))  // Clamp between 0-1
        : 0.5,
    }
  } catch (error) {
    console.error("Error classifying intent:", error)
    return getFallbackIntent(query)
  }
}

/**
 * Fallback intent classification using simple heuristics
 * Used when LLM classification fails
 */
function getFallbackIntent(query: string): QueryIntent {
  const lowerQuery = query.toLowerCase()

  // Pattern 1: List files
  if (
    lowerQuery.includes("list files") ||
    lowerQuery.includes("show files") ||
    lowerQuery === "files"
  ) {
    return {
      intentType: 'list_files',
      entities: {},
      reasoning: "Fallback: Keywords matched 'list files'",
      confidence: 0.7
    }
  }

  // Pattern 2: Generate tests
  if (
    lowerQuery.includes("test") ||
    lowerQuery.includes("jest") ||
    lowerQuery.includes("unit test")
  ) {
    // Try to extract filename
    const fileMatch = query.match(/(\w+\.(ts|tsx|js|jsx|py|go|java))/i)
    
    return {
      intentType: 'generate_tests',
      entities: {
        fileName: fileMatch ? fileMatch[1] : undefined
      },
      reasoning: "Fallback: Keywords matched 'test'",
      confidence: 0.7
    }
  }

  // Pattern 3: Explain file (has file extension)
  const fileExtMatch = query.match(/(\w+\.(ts|tsx|js|jsx|py|go|java))/i)
  if (fileExtMatch) {
    return {
      intentType: 'explain_file',
      entities: {
        fileName: fileExtMatch[1]
      },
      reasoning: "Fallback: Query contains filename with extension",
      confidence: 0.7
    }
  }

  // Pattern 4: Find definition
  if (
    lowerQuery.includes("where is") ||
    lowerQuery.includes("find definition") ||
    lowerQuery.includes("locate")
  ) {
    // Try to extract symbol name (camelCase or PascalCase)
    const symbolMatch = query.match(/\b([a-z]+[A-Z]\w+|[A-Z][a-z]+[A-Z]\w+)\b/)
    
    return {
      intentType: 'find_definition',
      entities: {
        symbolName: symbolMatch ? symbolMatch[1] : undefined
      },
      reasoning: "Fallback: Keywords matched 'where is/locate'",
      confidence: 0.6
    }
  }

  // Pattern 5: Explain symbol (camelCase/PascalCase word present)
  const symbolMatch = query.match(/\b([a-z]+[A-Z]\w+|[A-Z][a-z]+[A-Z]\w+)\b/)
  if (
    symbolMatch &&
    (lowerQuery.includes("explain") ||
     lowerQuery.includes("what does") ||
     lowerQuery.includes("how does"))
  ) {
    return {
      intentType: 'explain_symbol',
      entities: {
        symbolName: symbolMatch[1]
      },
      reasoning: "Fallback: Query has 'explain' + camelCase symbol",
      confidence: 0.6
    }
  }

  // Pattern 6: Find files
  if (
    lowerQuery.includes("find files") ||
    lowerQuery.includes("which files") ||
    lowerQuery.includes("show me files")
  ) {
    return {
      intentType: 'find_files',
      entities: {
        conceptKeywords: [query.replace(/find files|which files|show me files/gi, '').trim()]
      },
      reasoning: "Fallback: Keywords matched 'find files'",
      confidence: 0.6
    }
  }

  // Default: Explain concept (semantic RAG)
  return {
    intentType: 'explain_concept',
    entities: {
      conceptKeywords: query.split(/\s+/).filter(word => word.length > 3)
    },
    reasoning: "Fallback: No specific pattern matched, using semantic search",
    confidence: 0.5
  }
}