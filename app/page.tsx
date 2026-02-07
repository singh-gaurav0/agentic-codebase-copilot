/**
 * Landing Page
 * Introduction and navigation to dashboard
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold">Agentic Codebase Copilot</h1>

          <p className="text-xl text-gray-600">
            Your intelligent AI-powered assistant for understanding, analyzing,
            and generating code for your repositories.
          </p>

          <div className="space-y-4">
            <p className="text-gray-700">
              Upload your codebase and ask questions using AI agents:
            </p>
            <ul className="text-left max-w-2xl mx-auto space-y-2 text-gray-600">
              <li>
                <strong>Code RAG:</strong> Semantic search and question answering
              </li>
              <li>
                <strong>File Search:</strong> Find files by name, path, and
                pattern
              </li>
              <li>
                <strong>Test Generator:</strong> Automatically generate unit
                tests
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link href="/dashboard">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          {/* TODO: Add feature cards with icons */}
          <div className="border rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Upload Codebase</h3>
            <p className="text-gray-600 text-sm">
              Support for GitHub repositories and ZIP uploads
            </p>
          </div>

          <div className="border rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Intelligent Agents</h3>
            <p className="text-gray-600 text-sm">
              Specialized tools for different code analysis tasks
            </p>
          </div>

          <div className="border rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Semantic Search</h3>
            <p className="text-gray-600 text-sm">
              Vector-based search powered by embeddings
            </p>
          </div>
        </div>

        {/* TODO: Add more sections (how it works, examples, etc.) */}
      </div>
    </main>
  )
}
