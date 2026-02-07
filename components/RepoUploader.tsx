"use client"

import React from "react"

/**
 * Repository Uploader Component
 * Handles GitHub URL and ZIP file uploads
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function RepoUploader() {
  const [githubUrl, setGithubUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGitHubUpload = async () => {
    // TODO: Implement GitHub URL submission
    // 1. Validate GitHub URL format
    // 2. Call /api/ingest with GitHub URL
    // 3. Handle success/error response
    // 4. Update UI with results

    setLoading(true)
    setError(null)

    try {
      // Placeholder API call
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "github", url: githubUrl }),
      })

      if (!response.ok) {
        throw new Error("Failed to upload repository")
      }

      // TODO: Handle successful upload
      setGithubUrl("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleZipUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement ZIP file upload
    // 1. Read file from input
    // 2. Convert to buffer
    // 3. Call /api/ingest with ZIP buffer
    // 4. Handle success/error response

    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    // Placeholder file handling
    const formData = new FormData()
    formData.append("file", file)

    // TODO: Implement actual ZIP upload
    setLoading(false)
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Upload Repository</h2>

      <div className="space-y-4">
        {/* GitHub Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            GitHub Repository URL
          </label>
          <input
            type="text"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
            className="w-full px-3 py-2 border rounded-md"
            disabled={loading}
          />
          <Button
            onClick={handleGitHubUpload}
            disabled={!githubUrl || loading}
            className="mt-2"
          >
            {loading ? "Uploading..." : "Upload from GitHub"}
          </Button>
        </div>

        {/* ZIP Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Or Upload ZIP File
          </label>
          <input
            type="file"
            accept=".zip"
            onChange={handleZipUpload}
            disabled={loading}
            className="w-full"
          />
        </div>

        {/* Error Display */}
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>
    </Card>
  )
}
