import { NextResponse } from "next/server"
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
      return NextResponse.json(
        { success: false, error: "githubUrl is required" },
        { status: 400 }
      )
    }

    // 1️⃣ Create repository record
    const { repository: repo, alreadyIndexed } =
      await createOrGetRepository({
        name: githubUrl.split("/").pop() || "repo",
        sourceType: "github",
        sourceUrl: githubUrl,
      })

    if (alreadyIndexed) {
      return NextResponse.json({
        success: true,
        repositoryId: repo.id,
        message: "Repository already indexed.",
      })
    }

    // 2️⃣ Clone repository
    const repoPath = await cloneGitHubRepo(githubUrl)
    console.log("Repo path:", repoPath)

    // 3️⃣ Parse files
    const parsedFiles = await parseRepository(repoPath)

    if (parsedFiles.length === 0) {
      await fs.rm(repoPath, { recursive: true, force: true })

      return NextResponse.json({
        success: false,
        message: "No valid files found",
      })
    }

    // 4️⃣ Insert files into DB
    const insertedFiles = await insertFiles(
      parsedFiles.map((file) => ({
        repositoryId: repo.id,
        path: file.path,
        language: file.language,
        content: file.content,
      }))
    )

    // Map path → fileId
    const fileIdMap = new Map(
      insertedFiles.map((f: any) => [f.path, f.id])
    )

    // ========================================
    // V1 INDEXING (keep existing for now)
    // ========================================
    console.log("\n📦 Running V1 indexing (line-based chunks)...\n")

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

    // Generate embeddings for V1 chunks
    const embeddings = await generateEmbeddings(
      allChunks.map((c) => c.content)
    )

    // Insert V1 chunks (these will have chunk_type='block' by default)
    await insertChunks(
      allChunks.map((chunk, index) => ({
        repositoryId: chunk.repositoryId,
        fileId: chunk.fileId,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        embedding: embeddings[index],
      }))
    )

    console.log(`✅ V1 indexing complete: ${allChunks.length} chunks\n`)

    // ========================================
    // ✅ V2 INDEXING (symbol extraction)
    // ========================================
    console.log("🚀 Running V2 indexing (symbol extraction)...\n")

    let totalSymbols = 0

    // Create File objects with IDs for V2 indexing
    const filesWithIds = parsedFiles.map(file => ({
      id: fileIdMap.get(file.path)!,
      repositoryId: repo.id,
      path: file.path,
      name: file.path.split('/').pop() || file.path,
      content: file.content,
      language: file.language
    }))

    // Run V2 indexing (symbols + symbol-level chunks)
    for (const file of filesWithIds) {
      const symbolCount = await indexFileWithSymbols(repo.id, file as File)
      totalSymbols += symbolCount
    }

    console.log(`✅ V2 indexing complete: ${totalSymbols} symbols\n`)

    // ========================================
    // Cleanup
    // ========================================
    await fs.rm(repoPath, { recursive: true, force: true })

    return NextResponse.json({
      success: true,
      repositoryId: repo.id,
      totalFiles: parsedFiles.length,
      v1: {
        totalChunks: allChunks.length,
      },
      v2: {
        totalSymbols,
      }
    })
  } catch (error: unknown) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}