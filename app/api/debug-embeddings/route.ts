import { NextResponse } from "next/server"
import { generateEmbeddings } from "@/lib/embeddings/embed"

export async function GET() {
  try {
    const texts = [
      "function add(a, b) { return a + b }",
      "def contains_duplicate(nums): return True",
    ]

    const embeddings = await generateEmbeddings(texts)

    return NextResponse.json({
      success: true,
      vectorLength: embeddings[0]?.length,
      totalVectors: embeddings.length,
    })
  } catch (error: unknown) {
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
