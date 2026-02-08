/**
 * V2 Indexing Pipeline with Symbol Extraction
 */

import { TypeScriptParser } from './parser/astParser'
import { insertSymbols } from '../db/symbols'
import { insertCodeChunks } from '../db/chunks'
import { generateEmbeddings } from '../embeddings/embed'
import { File } from '@/types/index'

export async function indexFileWithSymbols(
  repositoryId: string,
  file: File
): Promise<number> { // ✅ Changed to return number
  // Only parse TypeScript/JavaScript files for now
  const supportedLanguages = ['typescript', 'javascript', 'tsx', 'jsx']
  
  if (!supportedLanguages.includes(file.language)) {
    console.log(`⏭️  Skipping ${file.path} (unsupported language: ${file.language})`)
    return 0 // ✅ Return 0 for skipped files
  }

  console.log(`🔍 Parsing ${file.path}...`)

  const parser = new TypeScriptParser()
  
  try {
    // 1️⃣ Parse file and extract symbols
    const { symbols } = parser.parse(file.path, file.content)

    if (symbols.length === 0) {
      console.log(`   No symbols found in ${file.path}`)
      return 0 // ✅ Return 0 if no symbols
    }

    console.log(`   Found ${symbols.length} symbols`)

    // 2️⃣ Insert symbols into database
    const symbolIds = await insertSymbols(repositoryId, file.id, symbols)

    // 3️⃣ Create symbol-level chunks with embeddings
    const symbolChunks = symbols.map((symbol, index) => ({
      repositoryId,
      fileId: file.id,
      content: symbol.content,
      chunkType: 'symbol' as const,
      symbolId: symbolIds[index],
      metadata: {
        symbolName: symbol.name,
        symbolType: symbol.type,
        signature: symbol.signature,
        qualifiedName: symbol.qualifiedName,
        startLine: symbol.startLine,
        endLine: symbol.endLine
      }
    }))

    // 4️⃣ Generate embeddings for symbols
    console.log(`   Generating embeddings for ${symbolChunks.length} symbols...`)
    
    const embeddingTexts = symbolChunks.map(chunk => {
      const meta = chunk.metadata
      // Include context in embedding: type, name, signature, and content
      return `${meta.symbolType} ${meta.symbolName}\n${meta.signature || ''}\n${chunk.content}`
    })

    const embeddings = await generateEmbeddings(embeddingTexts)

    // 5️⃣ Insert symbol chunks with embeddings
    await insertCodeChunks(
      symbolChunks.map((chunk, i) => ({
        ...chunk,
        embedding: embeddings[i]
      }))
    )

    console.log(`✅ Indexed ${file.path} with ${symbols.length} symbols`)
    
    return symbols.length // ✅ Return count

  } catch (error) {
    console.error(`❌ Error parsing ${file.path}:`, error)
    return 0 // ✅ Return 0 on error
  }
}