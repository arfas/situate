import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  query: string;
  limit?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { query, limit = 10 }: SearchRequest = await req.json();

    if (!query) {
      throw new Error("Query is required");
    }

    const { data: cachedQuery } = await supabaseClient
      .from("search_queries")
      .select("embedding")
      .eq("query_text", query.toLowerCase())
      .maybeSingle();

    let embedding: number[];

    if (cachedQuery) {
      embedding = cachedQuery.embedding;
      
      await supabaseClient
        .from("search_queries")
        .update({
          search_count: supabaseClient.raw("search_count + 1"),
          last_searched_at: new Date().toISOString(),
        })
        .eq("query_text", query.toLowerCase());
    } else {
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiApiKey) {
        throw new Error("OpenAI API key not configured");
      }

      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: query,
        }),
      });

      if (!response.ok) {
        const keywordResults = await performKeywordSearch(supabaseClient, query, limit);
        
        return new Response(
          JSON.stringify({
            results: keywordResults,
            searchType: "keyword",
            message: "Semantic search unavailable, using keyword search",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const { data } = await response.json();
      embedding = data[0].embedding;

      await supabaseClient.from("search_queries").insert({
        query_text: query.toLowerCase(),
        embedding,
      });
    }

    const { data: semanticResults, error: searchError } = await supabaseClient
      .rpc("search_rooms_hybrid", {
        query_text: query,
        query_embedding: embedding,
        match_count: limit,
      });

    if (searchError) {
      throw searchError;
    }

    const popularRooms = await getPopularRooms(supabaseClient, limit);

    return new Response(
      JSON.stringify({
        results: semanticResults || [],
        popularRooms,
        searchType: "semantic",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function performKeywordSearch(supabase: any, query: string, limit: number) {
  const { data } = await supabase
    .from("rooms")
    .select("id, title, description, category, member_count, message_count, last_activity")
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    .eq("is_archived", false)
    .order("member_count", { ascending: false })
    .limit(limit);

  return data || [];
}

async function getPopularRooms(supabase: any, limit: number) {
  const { data } = await supabase
    .from("rooms")
    .select("id, title, description, category, member_count, message_count, last_activity")
    .eq("is_archived", false)
    .order("member_count", { ascending: false })
    .limit(Math.min(limit, 5));

  return data || [];
}