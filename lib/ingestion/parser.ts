/**
 * Parses repository directory into file objects
 */

import fs from "fs/promises"
import path from "path"
import pathModule from "path"
const ALLOWED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".java",
]

export interface ParsedFile {
  path: string
  language: string | null
  content: string
}

export async function parseRepository(
  rootDir: string
): Promise<ParsedFile[]> {
  const files: ParsedFile[] = []

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, {
      withFileTypes: true,
    })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (
          entry.name === "node_modules" ||
          entry.name.startsWith(".")
        ) {
          continue
        }

        await walk(fullPath)
      } else {
        const ext = path.extname(entry.name)

        if (!ALLOWED_EXTENSIONS.includes(ext)) continue

        const content = await fs.readFile(
          fullPath,
          "utf-8"
        )

        if (content.length > 100_000) continue

        files.push({
          path: pathModule
          .relative(rootDir, fullPath)
          .replace(/\\/g, "/"),
          language: ext.replace(".", ""),
          content,
        })
      }
    }
  }

  await walk(rootDir)

  return files
}
