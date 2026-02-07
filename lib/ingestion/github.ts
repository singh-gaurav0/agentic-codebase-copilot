/**
 * GitHub Zipball Downloader
 * Downloads repository snapshot as zip and extracts it
 */

import fs from "fs/promises"
import path from "path"
import os from "os"
import AdmZip from "adm-zip"

function extractRepoInfo(githubUrl: string) {
  const match = githubUrl.match(
    /github\.com\/([^\/]+)\/([^\/]+)/
  )

  if (!match) {
    throw new Error("Invalid GitHub URL")
  }

  return {
    owner: match[1],
    repo: match[2].replace(".git", ""),
  }
}

export async function cloneGitHubRepo(
  githubUrl: string
): Promise<string> {
  const { owner, repo } = extractRepoInfo(githubUrl)

  const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`

  const response = await fetch(zipUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }),
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to download repository: ${response.status} ${response.statusText}`
    )
  }

  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "repo-")
  )

  const zipBuffer = Buffer.from(
    await response.arrayBuffer()
  )

  const zip = new AdmZip(zipBuffer)
  zip.extractAllTo(tempDir, true)

  // GitHub extracts into folder like owner-repo-hash
  const files = await fs.readdir(tempDir)

  let extractedFolder: string | null = null

  for (const file of files) {
    const fullPath = path.join(tempDir, file)
    const stat = await fs.stat(fullPath)

    if (stat.isDirectory()) {
      extractedFolder = file
      break
    }
  }

  if (!extractedFolder) {
    throw new Error("Failed to extract repository")
  }

  return path.join(tempDir, extractedFolder)
}
