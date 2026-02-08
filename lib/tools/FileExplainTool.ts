/**
 * File Explain Tool
 * Explains a specific file deterministically
 */

import { Tool, ToolInput, ToolOutput } from "../agent/types"
import { findFileByName } from "../db/files"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class FileExplainTool implements Tool {
  name = "file-explain"
  description = "Explains a specific file by name"

  async execute(input: ToolInput): Promise<ToolOutput> {
    if (!input.query?.trim()) {
      return {
        success: false,
        message: "Query cannot be empty.",
      }
    }

    if (!input.repositoryId) {
      return {
        success: false,
        message: "Repository ID is required.",
      }
    }

    // 🔹 Extract filename with extension
    const match = input.query.match(
      /([\w\-\/]+\.(ts|tsx|js|jsx|py|go|java))/
    )

    if (!match) {
      return {
        success: false,
        message:
          "Please specify a file name with extension (e.g., tools.ts).",
      }
    }

    const filename = match[1]

    // 🔹 Fetch file from DB
    const file = await findFileByName(
      input.repositoryId,
      filename
    )

    if (!file) {
      return {
        success: false,
        message: `File '${filename}' not found.`,
      }
    }

    // 🔹 Generate explanation
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a senior software engineer. Explain the provided file clearly and accurately. Do not invent functionality. Only describe what exists in the file.",
        },
        {
          role: "user",
          content: `
File Name:
${file.path}

Code:
${file.content}

Explain what this file does in detail.
`,
        },
      ],
    })

    return {
      success: true,
      answer: response.choices[0].message.content,
    }
  }
}
