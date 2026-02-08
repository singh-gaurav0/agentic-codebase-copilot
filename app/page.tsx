/**
 * Landing Page
 * RepoMind - AI-powered codebase intelligence
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"

function Logo() {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Minimal network-style logo */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        className="text-blue-500"
        fill="none"
      >
        <circle cx="20" cy="50" r="6" fill="currentColor" opacity="0.8" />
        <circle cx="50" cy="20" r="6" fill="currentColor" opacity="0.8" />
        <circle cx="80" cy="50" r="6" fill="currentColor" opacity="0.8" />
        <circle cx="50" cy="80" r="6" fill="currentColor" opacity="0.8" />

        <line x1="20" y1="50" x2="50" y2="20" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <line x1="50" y1="20" x2="80" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <line x1="80" y1="50" x2="50" y2="80" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <line x1="50" y1="80" x2="20" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      </svg>

      <span className="text-2xl font-semibold tracking-tight">
        RepoMind
      </span>
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-[#0B0F14] text-gray-100 overflow-hidden">

      {/* Subtle gradient layer */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0B0F14] via-[#0B0F14] to-[#111827]" />

      {/* Optional animated background component */}
      {/* <AnimatedBackground /> */}

      <div className="container max-w-5xl mx-auto px-6 py-20">
        <div className="text-center space-y-10">

          <Logo />

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Understand Your Codebase Instantly
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            RepoMind indexes your repository using vector embeddings and
            intelligent agent routing — so you can search, explain,
            and generate tests with precision.
          </p>

          <div className="pt-6">
            <Link href="/dashboard">
              <Button size="lg" className="px-8 py-6 text-base">
                Launch Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">

          <div className="bg-[#1F2937] border border-white/5 rounded-xl p-6 text-center hover:border-blue-500/40 transition">
            <h3 className="text-lg font-semibold mb-3">
              Semantic Code Search
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Retrieve relevant code chunks using vector similarity
              powered by pgvector and OpenAI embeddings.
            </p>
          </div>

          <div className="bg-[#1F2937] border border-white/5 rounded-xl p-6 text-center hover:border-blue-500/40 transition">
            <h3 className="text-lg font-semibold mb-3">
              Intelligent Explanation
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ask natural language questions and get grounded,
              repository-aware answers with similarity hardening.
            </p>
          </div>

          <div className="bg-[#1F2937] border border-white/5 rounded-xl p-6 text-center hover:border-blue-500/40 transition">
            <h3 className="text-lg font-semibold mb-3">
              Automated Test Generation
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Generate unit tests using deterministic file selection
              combined with LLM intelligence.
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}
