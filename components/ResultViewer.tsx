"use client"

/**
 * Result Viewer Component
 * Displays formatted query results and responses
 */

import { Card } from "@/components/ui/card"

interface ResultViewerProps {
  result?: {
    success: boolean
    answer?: string
    sources?: Array<{ file: string; lines: string }>
    metadata?: Record<string, unknown>
  }
  loading?: boolean
}

export default function ResultViewer({ result, loading }: ResultViewerProps) {
  if (!result && !loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          No results yet. Submit a query to get started.
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">Processing query...</div>
      </Card>
    )
  }

  if (!result) {
    return null
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Results</h2>

      {result.success ? (
        <div className="space-y-4">
          {/* Answer Section */}
          {result.answer && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Answer</h3>
              <p className="text-gray-700 leading-relaxed">{result.answer}</p>
            </div>
          )}

          {/* Sources Section */}
          {result.sources && result.sources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Sources</h3>
              <div className="space-y-2">
                {result.sources.map((source, idx) => (
                  <div key={idx} className="bg-gray-100 p-3 rounded-md text-sm">
                    <div className="font-mono text-gray-600">{source.file}</div>
                    <div className="text-gray-600">Lines: {source.lines}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Section */}
          {result.metadata && Object.keys(result.metadata).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Metadata</h3>
              <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto">
                {JSON.stringify(result.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="text-red-600">
          Query failed. Please try again.
          {/* TODO: Add specific error messages */}
        </div>
      )}
    </Card>
  )
}
