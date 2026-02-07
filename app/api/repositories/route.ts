import { NextResponse } from "next/server"
import { getAllRepositories } from "@/lib/db/repositories"

export async function GET() {
  try {
    const repos = await getAllRepositories()

    return NextResponse.json({
      success: true,
      repositories: repos,
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
