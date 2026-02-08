"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AgentStep {
  type: 'analyzing' | 'intent_classified' | 'executing_tool' | 'result' | 'error'
  message?: string
  intentType?: string
  confidence?: number
  reasoning?: string
  entities?: any
  toolName?: string
  toolDescription?: string
  answer?: string
  success?: boolean
  error?: string
}

export default function RepoQueryPage() {
  const params = useParams()
  const repoId = params.repoId as string

  const [query, setQuery] = useState("")
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleQuery() {
    if (!query.trim()) {
      setError("Query cannot be empty.")
      return
    }
  
    try {
      setError(null)
      setSteps([])
      setIsLoading(true)
  
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: repoId,
          query,
        }),
      })
  
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
  
      if (!reader) {
        throw new Error("Failed to read response")
      }
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
  
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
  
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            setSteps(prev => [...prev, data])
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const finalResult = steps.find(s => s.type === 'result')

  return (
    <main className="min-h-screen bg-[#0B0F14] text-gray-100 px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">
            Repository Query
          </h1>
          <Link href="/dashboard">
            <Button variant="ghost">Back</Button>
          </Link>
        </div>

        {/* Query Card */}
        <div className="bg-[#1F2937] border border-white/5 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            Ask a Question
          </h2>

          <textarea
            placeholder="e.g., explain the execute method, find files that handle authentication"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <div className="flex justify-end">
            <Button onClick={handleQuery} disabled={isLoading}>
              {isLoading ? "Processing..." : "Run Query"}
            </Button>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </div>

        {/* Agent Thinking Steps */}
        {steps.length > 0 && (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <AgentStepCard 
                key={index} 
                step={step} 
                isLatest={index === steps.length - 1}
              />
            ))}
          </div>
        )}

        {/* Final Output Panel (Keep for easy copying) */}
        {finalResult?.answer && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">
                Full Response
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  navigator.clipboard.writeText(finalResult.answer!)
                }
              >
                Copy
              </Button>
            </div>

            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">
              {finalResult.answer}
            </pre>
          </div>
        )}

      </div>
    </main>
  )
}

function AgentStepCard({ step, isLatest }: { step: AgentStep; isLatest: boolean }) {
  if (step.type === 'analyzing') {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          {isLatest ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
          ) : (
            <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-blue-300 font-medium">{step.message}</span>
        </div>
      </div>
    )
  }

  if (step.type === 'intent_classified') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-300 font-medium">
              Intent: <code className="px-2 py-1 bg-green-500/20 rounded text-sm">{step.intentType}</code>
            </span>
          </div>
          <div className="text-sm text-green-300/80 space-y-1">
            <div>Confidence: {((step.confidence || 0) * 100).toFixed(0)}%</div>
            <div className="italic opacity-75">"{step.reasoning}"</div>
            {step.entities && Object.values(step.entities).some(v => v) && (
              <div className="mt-2 text-xs">
                <strong>Extracted:</strong>{' '}
                {Object.entries(step.entities)
                  .filter(([_, v]) => v)
                  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                  .join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (step.type === 'executing_tool') {
    return (
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          {isLatest ? (
            <div className="animate-pulse h-3 w-3 bg-purple-400 rounded-full" />
          ) : (
            <svg className="h-4 w-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-purple-300 font-medium">
            Executing: <code className="px-2 py-1 bg-purple-500/20 rounded text-sm">{step.toolName}</code>
          </span>
        </div>
        {step.toolDescription && (
          <div className="mt-2 text-sm text-purple-300/70 italic">
            {step.toolDescription}
          </div>
        )}
      </div>
    )
  }

  if (step.type === 'result') {
    return (
      <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-gray-300 font-medium">Result Ready</span>
        </div>
        <div className="text-sm text-gray-300/90 bg-[#111827] rounded p-3 max-h-48 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
            {step.answer || step.message}
          </pre>
        </div>
      </div>
    )
  }

  if (step.type === 'error') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-300 font-medium">Error: {step.error}</span>
        </div>
      </div>
    )
  }

  return null
}