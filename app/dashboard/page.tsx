/**
 * Dashboard Page
 * Main interface for uploading repositories and querying codebase
 */

"use client"

import { useState } from "react"
import RepoUploader from "@/components/RepoUploader"
import QueryBox from "@/components/QueryBox"
import ResultViewer from "@/components/ResultViewer"

export default function DashboardPage() {
  const [repositoryId, setRepositoryId] = useState<string | undefined>()
  const [queryResult, setQueryResult] = useState<unknown>()

  // TODO: Implement result update callback from QueryBox
  // This will be passed down as a prop to update UI with results

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Agentic Codebase Copilot</h1>

        <div className="space-y-6">
          {/* Repository Upload Section */}
          <section>
            <RepoUploader />
          </section>

          {/* Query Section */}
          {repositoryId && (
            <section>
              <QueryBox repositoryId={repositoryId} />
            </section>
          )}

          {/* Results Section */}
          {queryResult && (
            <section>
              <ResultViewer result={queryResult} />
            </section>
          )}

          {/* Placeholder for empty state */}
          {!repositoryId && (
            <div className="text-center text-gray-500 py-12">
              Upload a repository to get started
            </div>
          )}
        </div>
      </div>

      {/* TODO: Implement loading states */}
      {/* TODO: Implement error boundaries */}
      {/* TODO: Add repository list/management */}
    </main>
  )
}
