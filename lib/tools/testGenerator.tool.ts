/**
 * Test Generator Tool
 * Generates Jest unit tests for a given file
 */

import { Tool, ToolInput, ToolOutput } from "../agent/types"

import { findFileByName } from "../db/files"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})


export class TestGeneratorTool implements Tool {
  name = "test-generator"
  description = "Generates Jest tests for a specific file"

  async execute(input: ToolInput): Promise<ToolOutput> {
    const lowerQuery = input.query.toLowerCase()

    // 1️⃣ Extract filename from query (basic heuristic)
    const match = lowerQuery.match(
      /([\w\-_.]+\.(ts|tsx|js|jsx|py|go|java))/
    )

    if (!match) {
      return {
        success: false,
        message:
          "Please specify a file name (e.g., auth.service.ts).",
      }
    }

    const filename = match[1]

    // 2️⃣ Fetch file from DB
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

    // 3️⃣ Generate tests using LLM
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a senior software engineer. Generate high-quality Jest unit tests for the given file.",
        },
        {
          role: "user",
          content: `
File Name:
${file.path}

Code:
${file.content}

Generate complete Jest test file with describe and it blocks.
Only return the test code.
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
