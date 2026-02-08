/**
 * List Files Tool
 * Returns all file paths in a repository
 */

import { Tool, ToolInput, ToolOutput } from "../agent/types"
import { getAllFiles } from "../db/files"

export class ListFilesTool implements Tool {
  name = "list-files"
  description = "Lists all files in the repository"

  async execute(input: ToolInput): Promise<ToolOutput> {
    if (!input.repositoryId) {
      return {
        success: false,
        message: "Repository ID is required.",
      }
    }

    const files = await getAllFiles(input.repositoryId)

    if (!files || files.length === 0) {
      return {
        success: false,
        message: "No files found in this repository.",
      }
    }

    const filePaths = files
      .map((file) => file.path)
      .sort()

    return {
      success: true,
      answer: filePaths.join("\n"),
    }
  }
}
