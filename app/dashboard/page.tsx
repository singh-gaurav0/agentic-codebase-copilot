"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

import Link from "next/link"
import { useLoader } from "../context/loader-context"
import { useToast } from "@/hooks/use-toast"

interface Repository {
  id: string
  name: string
  source_type: string
  source_url: string
  created_at: string
}

export default function DashboardPage() {
  const { show, hide } = useLoader()

  const [githubUrl, setGithubUrl] = useState("")
  const [repos, setRepos] = useState<Repository[]>([])
  const [error, setError] = useState<string | null>(null)
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
      show()
  
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl }),
      })
  
      const data = await res.json()
  
      if (!data.success) {
        throw new Error(data.error || "Failed to ingest repository.")
      }
  
      toast({
        title: "Success 🎉",
        description: data.message,
      })
  
      setGithubUrl("")
      fetchRepositories()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      hide()
    }
  }
  

  async function handleDelete(id: string) {
    try {
      show()
  
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
    } finally {
      hide()
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

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="https://github.com/user/repository"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="flex-1 bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleIngest}>
              Index Repository
            </Button>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
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
