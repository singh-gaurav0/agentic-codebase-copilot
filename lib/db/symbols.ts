/**
 * Database operations for symbols table
 */

import { getSupabaseClient } from './client'
import { ParsedSymbol } from '../indexing/parser/astParser'

export async function insertSymbols(
  repositoryId: string,
  fileId: string,
  symbols: ParsedSymbol[]
): Promise<string[]> {
  if (symbols.length === 0) {
    return []
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('symbols')
    .insert(
      symbols.map(s => ({
        repository_id: repositoryId,
        file_id: fileId,
        name: s.name,
        qualified_name: s.qualifiedName,
        type: s.type,
        start_line: s.startLine,
        end_line: s.endLine,
        signature: s.signature,
        content: s.content,
        docstring: s.docstring,
        is_exported: s.isExported,
        parent_symbol_id: s.parentSymbolId || null
      }))
    )
    .select('id')

  if (error) {
    console.error('Error inserting symbols:', error)
    throw error
  }

  return data.map(row => row.id)
}

export async function findSymbolByName(
  repositoryId: string,
  symbolName: string
): Promise<any | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('symbols')
    .select(`
      *,
      files!inner(path, language)
    `)
    .eq('repository_id', repositoryId)
    .eq('name', symbolName)
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // Not found
      return null
    }
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    qualifiedName: data.qualified_name,
    type: data.type,
    startLine: data.start_line,
    endLine: data.end_line,
    signature: data.signature,
    content: data.content,
    docstring: data.docstring,
    isExported: data.is_exported,
    file: {
      path: data.files.path,
      language: data.files.language
    }
  }
}

export async function findSymbolsByFile(
  fileId: string
): Promise<any[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('symbols')
    .select('*')
    .eq('file_id', fileId)
    .order('start_line', { ascending: true })

  if (error) throw error

  return data.map(row => ({
    id: row.id,
    name: row.name,
    qualifiedName: row.qualified_name,
    type: row.type,
    startLine: row.start_line,
    endLine: row.end_line,
    signature: row.signature,
    content: row.content,
    docstring: row.docstring,
    isExported: row.is_exported
  }))
}