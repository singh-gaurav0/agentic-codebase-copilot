/**
 * Splits file content into overlapping chunks
 */

const CHUNK_SIZE = 400
const OVERLAP = 100

export interface Chunk {
  content: string
  tokenCount: number
}

export function chunkContent(content: string): Chunk[] {
  const lines = content.split("\n")
  const chunks: Chunk[] = []

  let start = 0

  while (start < lines.length) {
    const slice = lines.slice(
      start,
      start + CHUNK_SIZE
    )

    const chunkText = slice.join("\n")

    chunks.push({
      content: chunkText,
      tokenCount: Math.ceil(chunkText.length / 4),
    })

    start += CHUNK_SIZE - OVERLAP
  }

  return chunks
}
