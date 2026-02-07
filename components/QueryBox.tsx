"use client"

/**
 * Query Box Component
 * User interface for querying the codebase
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface QueryBoxProps {
  repositoryId?: string
}

export default function QueryBox({ repositoryId }: QueryBoxProps) {
  const [query, setQuery] = useState("")
  const [toolType, setToolType] = useState<"code-rag" | "file-search" | "test-generator">(
    "code-rag"
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    // TODO: Implement query submission
    // 1. Validate query and repository
    // 2. Call /api/query with query and tool type
    // 3. Handle streaming or batch response
    // 4. Pass results to ResultViewer

    if (!query.trim()) {
      setError("Query cannot be empty")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          toolType,
          repositoryId,
        }),
      })

      if (!response.ok) {
        throw new Error("Query failed")
      }

      // TODO: Handle response and pass to parent
      const data = await response.json()
      console.log("[QueryBox] Response:", data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Query Repository</h2>

      <div className="space-y-4">
        {/* Query Textarea */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Question</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about the codebase..."
            disabled={loading}
            className="w-full px-3 py-2 border rounded-md resize-none h-32"
          />
        </div>

        {/* Tool Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Tool Type</label>
          <select
            value={toolType}
            onChange={(e) =>
              setToolType(
                e.target.value as "code-rag" | "file-search" | "test-generator"
              )
            }
            disabled={loading}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="code-rag">Code RAG</option>
            <option value="file-search">File Search</option>
            <option value="test-generator">Test Generator</option>
          </select>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!query.trim() || !repositoryId || loading}
          className="w-full"
        >
          {loading ? "Processing..." : "Submit Query"}
        </Button>

        {/* Error Display */}
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>
    </Card>
  )
}
