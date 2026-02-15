1. Repositories Table

CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('github', 'zip')),
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

2. Files Table

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  language TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX files_repository_id_idx ON files(repository_id);


3. Code Chunks Table (Enhanced V2)

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE code_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  token_count INT,
  embedding VECTOR(1536),
  
  -- V2 additions
  chunk_type TEXT DEFAULT 'block' CHECK (chunk_type IN ('symbol', 'file', 'block')),
  symbol_id UUID REFERENCES symbols(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX code_chunks_repository_id_idx ON code_chunks(repository_id);
CREATE INDEX code_chunks_embedding_idx ON code_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX code_chunks_chunk_type_idx ON code_chunks(chunk_type);
CREATE INDEX code_chunks_symbol_id_idx ON code_chunks(symbol_id);

4. Symbols Table (V2 - New)

CREATE TABLE symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  
  -- Symbol identity
  name TEXT NOT NULL,
  qualified_name TEXT, -- e.g., "CodeRagTool.execute"
  type TEXT NOT NULL CHECK (type IN (
    'function', 'method', 'class', 'interface', 
    'type', 'variable', 'constant', 'enum'
  )),
  
  -- Location
  start_line INT NOT NULL,
  end_line INT NOT NULL,
  
  -- Content
  signature TEXT,
  content TEXT NOT NULL,
  docstring TEXT,
  
  -- Metadata
  is_exported BOOLEAN DEFAULT false,
  parent_symbol_id UUID REFERENCES symbols(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX symbols_repository_id_idx ON symbols(repository_id);
CREATE INDEX symbols_name_idx ON symbols(name);
CREATE INDEX symbols_file_id_idx ON symbols(file_id);
CREATE INDEX symbols_type_idx ON symbols(type);

5. Symbol References Table (V2 - Placeholder for Phase 3)

CREATE TABLE symbol_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol_id UUID NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  
  line INT NOT NULL,
  column_start INT,
  column_end INT,
  
  reference_type TEXT NOT NULL CHECK (reference_type IN (
    'call', 'import', 'type_annotation', 'instantiation', 'assignment'
  )),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX symbol_references_symbol_id_idx ON symbol_references(symbol_id);
CREATE INDEX symbol_references_file_id_idx ON symbol_references(file_id);

6. File Dependencies Table (V2 - Placeholder for Phase 3)

CREATE TABLE file_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  from_file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  to_file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  
  import_name TEXT,
  import_type TEXT CHECK (import_type IN ('default', 'named', 'namespace', 'dynamic')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(from_file_id, to_file_id, import_name)
);

CREATE INDEX file_dependencies_repository_id_idx ON file_dependencies(repository_id);
CREATE INDEX file_dependencies_from_file_idx ON file_dependencies(from_file_id);
CREATE INDEX file_dependencies_to_file_idx ON file_dependencies(to_file_id);

Vector Search Function (Custom)

CREATE OR REPLACE FUNCTION match_code_chunks (
  query_embedding VECTOR(1536),
  match_repository_id UUID,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  file_id UUID,
  content TEXT,
  token_count INT,
  similarity FLOAT,
  chunk_type TEXT,
  symbol_id UUID,
  metadata JSONB
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    file_id,
    content,
    token_count,
    1 - (embedding <=> query_embedding) AS similarity,
    chunk_type,
    symbol_id,
    metadata
  FROM code_chunks
  WHERE repository_id = match_repository_id
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
