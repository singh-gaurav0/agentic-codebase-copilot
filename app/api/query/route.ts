import { NextResponse } from "next/server"
import { routeToTool } from "@/lib/agent/router"
import { ToolInput } from "@/lib/agent/types"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { repositoryId, query } = body

    if (!repositoryId || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid fields" },
        { status: 400 }
      )
    }

    const normalizedQuery = query.trim()

    // Create a readable stream for SSE (Server-Sent Events)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Send "analyzing" event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'analyzing',
              message: 'Analyzing your query...'
            })}\n\n`)
          )

          // Step 2: Route to tool (classify intent)
          const { tool, intent } = await routeToTool(normalizedQuery)

          // Step 3: Send "intent_classified" event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'intent_classified',
              intentType: intent.intentType,
              confidence: intent.confidence,
              reasoning: intent.reasoning,
              entities: intent.entities,
              toolName: tool.name
            })}\n\n`)
          )

          // Step 4: Send "executing_tool" event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'executing_tool',
              toolName: tool.name,
              toolDescription: tool.description
            })}\n\n`)
          )

          // Step 5: Execute the tool
          const input: ToolInput = {
            repositoryId,
            query: normalizedQuery,
            entities: intent.entities,
          }

          const result = await tool.execute(input)

          // Step 6: Send final result
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'result',
              ...result,
              metadata: {
                ...result.metadata,
                intent: intent.intentType,
                confidence: intent.confidence,
              }
            })}\n\n`)
          )

          controller.close()
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
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
    console.error("Chat error:", error)
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