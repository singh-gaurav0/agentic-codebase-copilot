/**
 * Repository Summary Tool
 * Provides high-level overview of the entire repository
 */

import { Tool, ToolInput, ToolOutput } from "../agent/types"
import { getSupabaseClient } from "../db/client"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class RepoSummaryTool implements Tool {
  name = "repo-summary"
  description = "Generates a high-level summary of the entire repository"

  async execute(input: ToolInput): Promise<ToolOutput> {
    const supabase = getSupabaseClient()

    // 1️⃣ Get repository info
    const { data: repo } = await supabase
      .from('repositories')
      .select('name, source_url')
      .eq('id', input.repositoryId)
      .single()

    if (!repo) {
      return {
        success: false,
        message: "Repository not found.",
      }
    }

    // 2️⃣ Get file statistics
    const { data: files } = await supabase
      .from('files')
      .select('path, language')
      .eq('repository_id', input.repositoryId)

    if (!files || files.length === 0) {
      return {
        success: false,
        message: "No files found in repository.",
      }
    }

    // 3️⃣ Get symbol statistics
    const { data: symbols } = await supabase
      .from('symbols')
      .select('type, is_exported')
      .eq('repository_id', input.repositoryId)

    // 4️⃣ Aggregate statistics
    const languageCounts = files.reduce((acc, file) => {
      acc[file.language] = (acc[file.language] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const symbolTypeCounts = symbols?.reduce((acc, symbol) => {
      acc[symbol.type] = (acc[symbol.type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const exportedSymbols = symbols?.filter(s => s.is_exported).length || 0

    // 5️⃣ Get sample of important files (top-level, config, entry points)
    const importantFiles = files
      .filter(f => 
        f.path.split('/').length <= 2 || // Top-level files
        f.path.includes('index') ||
        f.path.includes('main') ||
        f.path.includes('app') ||
        f.path.includes('config')
      )
      .slice(0, 10)
      .map(f => f.path)

    // 6️⃣ Get sample of exported symbols for context
    const { data: exportedSymbolsSample } = await supabase
      .from('symbols')
      .select('name, type, qualified_name')
      .eq('repository_id', input.repositoryId)
      .eq('is_exported', true)
      .limit(20)

    // 7️⃣ Generate AI summary
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a senior software architect. Generate a concise, high-level summary of this codebase.

Structure your response:
1. **Purpose**: What this codebase does (1-2 sentences)
2. **Tech Stack**: Main languages/frameworks used
3. **Architecture**: High-level structure (2-3 sentences)
4. **Key Components**: Main modules/features (bullet points)

Be concise and focus on the big picture. Avoid excessive detail.`,
        },
        {
          role: "user",
          content: `
Repository: ${repo.name}
${repo.source_url ? `URL: ${repo.source_url}` : ''}

**Statistics:**
- Total Files: ${files.length}
- Languages: ${Object.entries(languageCounts).map(([lang, count]) => `${lang} (${count})`).join(', ')}
- Total Symbols: ${symbols?.length || 0}
- Symbol Types: ${Object.entries(symbolTypeCounts).map(([type, count]) => `${count} ${type}s`).join(', ')}
- Exported Symbols: ${exportedSymbols}

**Key Files:**
${importantFiles.join('\n')}

**Sample Exported API:**
${exportedSymbolsSample?.slice(0, 10).map(s => `- ${s.qualified_name} (${s.type})`).join('\n') || 'None'}

Generate a repository summary.
`,
        },
      ],
    })

    const summary = response.choices[0].message.content

    return {
      success: true,
      answer: summary,
      metadata: {
        totalFiles: files.length,
        totalSymbols: symbols?.length || 0,
        languages: Object.keys(languageCounts),
        exportedSymbols,
      }
    }
  }
}