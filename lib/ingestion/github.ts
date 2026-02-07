/**
 * GitHub Ingestion
 * Clones a public repository (shallow clone)
 */

import path from "path"
import fs from "fs/promises"
import simpleGit from "simple-git"
import os from "os"

const git = simpleGit()

export async function cloneGitHubRepo(repoUrl: string) {
  const tempDir = path.join(
    os.tmpdir(),
    `repo-${Date.now()}`
  )

  await git.clone(repoUrl, tempDir, ["--depth", "1"])

  return tempDir
}
