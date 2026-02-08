import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/db/client"

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from("repositories")
      .delete()
      .eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      message: "Repository deleted successfully.",
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
