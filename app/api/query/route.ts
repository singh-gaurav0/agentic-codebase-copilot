import { NextResponse } from "next/server"
import { routeToTool } from "@/lib/agent/router"
import { ToolInput } from "@/lib/agent/types"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { repositoryId, query } = body

    if (!repositoryId || !query) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      )
    }

    // 🔹 Route to appropriate tool
    const tool = routeToTool(query)

    const input: ToolInput = {
      repositoryId,
      query,
    }

    const result = await tool.execute(input)

    return NextResponse.json(result)
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
