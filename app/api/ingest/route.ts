import fs from "fs/promises"

import { createOrGetRepository } from "@/lib/db/repositories"
import { insertFiles } from "@/lib/db/files"
import { insertChunks } from "@/lib/db/chunks"

import { cloneGitHubRepo } from "@/lib/ingestion/github"
import { parseRepository } from "@/lib/ingestion/parser"
import { chunkContent } from "@/lib/ingestion/chunker"

import { generateEmbeddings } from "@/lib/embeddings/embed"

import { File } from '@/types/index'
import { indexFileWithSymbols } from "@/lib/indexing/indexRepositoryV2"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { githubUrl } = body

    if (!githubUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "githubUrl is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send step updates
          const sendStep = (type: string, message: string, details?: any) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type, message, details })}\n\n`)
            )
          }

          // 1️⃣ Create repository record
          const { repository: repo, alreadyIndexed } = await createOrGetRepository({
            name: githubUrl.split("/").pop() || "repo",
            sourceType: "github",
            sourceUrl: githubUrl,
          })

          if (alreadyIndexed) {
            sendStep('complete', 'Repository already indexed', { repositoryId: repo.id })
            controller.close()
            return
          }

          // 2️⃣ Clone repository
          sendStep('cloning', '📥 Cloning repository...')
          const repoPath = await cloneGitHubRepo(githubUrl)

          // 3️⃣ Parse files
          sendStep('parsing', '📂 Scanning files...')
          const parsedFiles = await parseRepository(repoPath)

          if (parsedFiles.length === 0) {
            await fs.rm(repoPath, { recursive: true, force: true })
            sendStep('error', 'No valid files found')
            controller.close()
            return
          }

          sendStep('parsing', `✅ Found ${parsedFiles.length} files`, {
            filesCount: parsedFiles.length
          })

          // 4️⃣ Insert files into DB
          const insertedFiles = await insertFiles(
            parsedFiles.map((file) => ({
              repositoryId: repo.id,
              path: file.path,
              language: file.language,
              content: file.content,
            }))
          )

          const fileIdMap = new Map(insertedFiles.map((f: any) => [f.path, f.id]))

          // ========================================
          // V1 INDEXING
          // ========================================
          sendStep('indexing_v1', '📦 Creating line-based chunks...')

          const allChunks: {
            repositoryId: string
            fileId: string
            content: string
            tokenCount: number
          }[] = []

          for (const file of parsedFiles) {
            const chunks = chunkContent(file.content)
            for (const chunk of chunks) {
              allChunks.push({
                repositoryId: repo.id,
                fileId: fileIdMap.get(file.path),
                content: chunk.content,
                tokenCount: chunk.tokenCount,
              })
            }
          }

          sendStep('indexing_v1', `🧮 Generating embeddings for ${allChunks.length} chunks...`, {
            chunksCount: allChunks.length
          })

          const embeddings = await generateEmbeddings(allChunks.map((c) => c.content))

          await insertChunks(
            allChunks.map((chunk, index) => ({
              repositoryId: chunk.repositoryId,
              fileId: chunk.fileId,
              content: chunk.content,
              tokenCount: chunk.tokenCount,
              embedding: embeddings[index],
            }))
          )

          sendStep('indexing_v1', `✅ V1 indexing complete`, {
            totalChunks: allChunks.length
          })

          // ========================================
          // V2 INDEXING
          // ========================================
          sendStep('indexing_v2', '🚀 Extracting symbols...')

          let totalSymbols = 0
          const filesWithIds = parsedFiles.map(file => ({
            id: fileIdMap.get(file.path)!,
            repositoryId: repo.id,
            path: file.path,
            name: file.path.split('/').pop() || file.path,
            content: file.content,
            language: file.language
          }))

          for (let i = 0; i < filesWithIds.length; i++) {
            const file = filesWithIds[i]
            
            const symbolCount = await indexFileWithSymbols(repo.id, file as File)
            totalSymbols += symbolCount

            if ((i + 1) % 5 === 0 || i === filesWithIds.length - 1) {
              // Send progress every 5 files or at the end
              sendStep('indexing_v2', `🔍 Processing files (${i + 1}/${filesWithIds.length})...`, {
                current: i + 1,
                total: filesWithIds.length,
                totalSymbols
              })
            }
          }

          sendStep('indexing_v2', `✅ V2 indexing complete`, {
            totalSymbols
          })

          // Cleanup
          await fs.rm(repoPath, { recursive: true, force: true })

          // Final result
          sendStep('complete', `✨ Indexing complete!`, {
            repositoryId: repo.id,
            totalFiles: parsedFiles.length,
            totalChunks: allChunks.length,
            totalSymbols
          })

          controller.close()

        } catch (error: unknown) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: error instanceof Error ? error.message : 'Unknown error'
            })}\n\n`)
          )
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}