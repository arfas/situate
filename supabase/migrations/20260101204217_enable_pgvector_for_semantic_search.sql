/*
  # Enable pgvector for Semantic Search

  ## Overview
  Enable the pgvector extension to support AI-powered semantic search for rooms.
  Add embedding column to rooms table to store OpenAI embeddings (1536 dimensions).

  ## Changes
  1. Enable pgvector extension
  2. Add embedding column to rooms table (vector type with 1536 dimensions for OpenAI embeddings)
  3. Create index for vector similarity search using cosine distance
  4. Create function for semantic search
  5. Create search_queries cache table to minimize API calls

  ## Performance
  - HNSW index for fast approximate nearest neighbor search
  - Cache frequently searched queries to reduce OpenAI API costs
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to rooms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE rooms ADD COLUMN embedding vector(1536);
  END IF;
END $$;

-- Create index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_rooms_embedding ON rooms 
USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL AND is_archived = false;

-- Create search_queries cache table
CREATE TABLE IF NOT EXISTS search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text text NOT NULL UNIQUE,
  embedding vector(1536) NOT NULL,
  search_count int DEFAULT 1,
  last_searched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_text ON search_queries(query_text);
CREATE INDEX IF NOT EXISTS idx_search_queries_last_searched ON search_queries(last_searched_at DESC);

-- Create function for semantic room search
CREATE OR REPLACE FUNCTION search_rooms_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  member_count int,
  message_count int,
  last_activity timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description,
    r.category,
    r.member_count,
    r.message_count,
    r.last_activity,
    1 - (r.embedding <=> query_embedding) as similarity
  FROM rooms r
  WHERE r.embedding IS NOT NULL
    AND r.is_archived = false
    AND 1 - (r.embedding <=> query_embedding) > match_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function for hybrid search (semantic + keyword)
CREATE OR REPLACE FUNCTION search_rooms_hybrid(
  query_text text,
  query_embedding vector(1536),
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  member_count int,
  message_count int,
  last_activity timestamptz,
  similarity float,
  match_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT 
      r.id,
      r.title,
      r.description,
      r.category,
      r.member_count,
      r.message_count,
      r.last_activity,
      1 - (r.embedding <=> query_embedding) as similarity,
      'semantic'::text as match_type
    FROM rooms r
    WHERE r.embedding IS NOT NULL
      AND r.is_archived = false
    ORDER BY r.embedding <=> query_embedding
    LIMIT match_count
  ),
  keyword_results AS (
    SELECT 
      r.id,
      r.title,
      r.description,
      r.category,
      r.member_count,
      r.message_count,
      r.last_activity,
      0.5::float as similarity,
      'keyword'::text as match_type
    FROM rooms r
    WHERE r.is_archived = false
      AND (
        r.title ILIKE '%' || query_text || '%'
        OR r.description ILIKE '%' || query_text || '%'
        OR r.category ILIKE '%' || query_text || '%'
      )
    LIMIT match_count
  )
  SELECT DISTINCT ON (id) * 
  FROM (
    SELECT * FROM semantic_results
    UNION ALL
    SELECT * FROM keyword_results
  ) combined
  ORDER BY id, similarity DESC, 
    CASE 
      WHEN match_type = 'semantic' THEN 1
      ELSE 2
    END
  LIMIT match_count;
END;
$$;