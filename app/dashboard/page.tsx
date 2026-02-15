"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Repository {
  id: string
  name: string
  source_type: string
  source_url: string
  created_at: string
}

interface IngestStep {
  type: 'cloning' | 'parsing' | 'indexing_v1' | 'indexing_v2' | 'complete' | 'error'
  message?: string
  progress?: {
    current: number
    total: number
  }
  details?: any
}

export default function DashboardPage() {
  const [githubUrl, setGithubUrl] = useState("")
  const [repos, setRepos] = useState<Repository[]>([])
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestSteps, setIngestSteps] = useState<IngestStep[]>([])
  const { toast } = useToast()

  async function fetchRepositories() {
    const res = await fetch("/api/repositories")
    const data = await res.json()
    if (data.success) {
      setRepos(data.repositories)
    }
  }

  useEffect(() => {
    fetchRepositories()
  }, [])

  async function handleIngest() {
    if (!githubUrl.trim()) {
      toast({
        title: "Invalid Input",
        description: "GitHub URL cannot be empty.",
        variant: "destructive",
      })
      return
    }
  
    try {
      setIngestSteps([])
      setIsIngesting(true)
  
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl }),
      })

      // Check if it's a streaming response
      const contentType = res.headers.get('content-type')
      
      if (contentType?.includes('text/event-stream')) {
        // Streaming response
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
              setIngestSteps(prev => [...prev, data])
              
              if (data.type === 'complete') {
                toast({
                  title: "Success 🎉",
                  description: "Repository indexed successfully!",
                })
                setGithubUrl("")
                fetchRepositories()
              }
              
              if (data.type === 'error') {
                throw new Error(data.error)
              }
            }
          }
        }
      } else {
        // Regular JSON response (backward compatibility)
        const data = await res.json()
        
        if (!data.success) {
          throw new Error(data.error || "Failed to ingest repository.")
        }

        toast({
          title: "Success 🎉",
          description: data.message || "Repository indexed successfully!",
        })

        setGithubUrl("")
        fetchRepositories()
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsIngesting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/repositories/${id}`, {
        method: "DELETE",
      })
  
      if (!res.ok) {
        throw new Error("Failed to delete repository.")
      }
  
      setRepos((prev) => prev.filter((r) => r.id !== id))
  
      toast({
        title: "Deleted",
        description: "Repository removed successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] text-gray-100 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <Link href="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>

        {/* Ingest Card */}
        <div className="bg-[#1F2937] border border-white/5 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">
            Index New Repository
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="https://github.com/user/repository"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="flex-1 bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isIngesting}
            />
            <Button 
  onClick={handleIngest} 
  disabled={isIngesting}
  className="w-full sm:w-auto"
>
  {isIngesting ? "Indexing..." : "Index Repository"}
</Button>

          </div>

          {/* Ingestion Progress */}
          {ingestSteps.length > 0 && (
            <div className="space-y-2 mt-4">
              {ingestSteps.map((step, index) => (
                <IngestStepCard 
                  key={index} 
                  step={step} 
                  isLatest={index === ingestSteps.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Repository List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            Indexed Repositories
          </h2>

          {repos.length === 0 && (
            <p className="text-gray-400 text-sm">
              No repositories indexed yet.
            </p>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="bg-[#1F2937] border border-white/5 rounded-xl p-5 space-y-3"
              >
                <h3 className="font-semibold text-lg">
                  {repo.name}
                </h3>

                <p className="text-gray-400 text-sm break-all">
                  {repo.source_url}
                </p>

                <div className="flex justify-between items-center pt-3">
                  <Link href={`/dashboard/${repo.id}`}>
                    <Button size="sm">
                      Open
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(repo.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}

function IngestStepCard({ step, isLatest }: { step: IngestStep; isLatest: boolean }) {
  if (step.type === 'cloning') {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <div className="flex items-center gap-3">
          {isLatest ? (
            <div className="animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full" />
          ) : (
            <svg className="h-3 w-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-blue-300 text-sm font-medium">Cloning repository...</span>
        </div>
      </div>
    )
  }

  if (step.type === 'parsing') {
    return (
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
        <div className="flex items-center gap-3">
          {isLatest ? (
            <div className="animate-pulse h-3 w-3 bg-purple-400 rounded-full" />
          ) : (
            <svg className="h-3 w-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-purple-300 text-sm font-medium">
            Parsing files{step.progress ? ` (${step.progress.current}/${step.progress.total})` : ''}...
          </span>
        </div>
      </div>
    )
  }

  if (step.type === 'indexing_v1') {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
        <div className="flex items-center gap-3">
          {isLatest ? (
            <div className="animate-pulse h-3 w-3 bg-yellow-400 rounded-full" />
          ) : (
            <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-yellow-300 text-sm font-medium">
            Creating line-based chunks{step.details?.totalChunks ? ` (${step.details.totalChunks} chunks)` : ''}...
          </span>
        </div>
      </div>
    )
  }

  if (step.type === 'indexing_v2') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
        <div className="flex items-center gap-3">
          {isLatest ? (
            <div className="animate-pulse h-3 w-3 bg-green-400 rounded-full" />
          ) : (
            <svg className="h-3 w-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-green-300 text-sm font-medium">
            Extracting symbols{step.details?.totalSymbols ? ` (${step.details.totalSymbols} symbols)` : ''}...
          </span>
        </div>
      </div>
    )
  }

  if (step.type === 'complete') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-emerald-300 text-sm font-medium">
            ✨ Indexing complete! {step.details?.totalFiles && `${step.details.totalFiles} files indexed.`}
          </span>
        </div>
      </div>
    )
  }

  if (step.type === 'error') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-300 text-sm font-medium">{step.message || 'An error occurred'}</span>
        </div>
      </div>
    )
  }

  return null
}