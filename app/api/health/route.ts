import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/db/client"
import { createRepository } from "@/lib/db/repositories"

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const repo = await createRepository({
        name: "test-repo",
        sourceType: "github",
        sourceUrl: "https://github.com/test/test",
      })
      
      return NextResponse.json({ repo })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}
