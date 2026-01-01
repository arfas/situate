import { supabase } from '../lib/supabase';

export interface Room {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  member_count: number;
  message_count: number;
  last_activity: string;
  similarity?: number;
  match_type?: string;
}

export interface SearchResponse {
  results: Room[];
  popularRooms: Room[];
  searchType: 'semantic' | 'keyword';
  message?: string;
}

export async function searchRooms(query: string, limit = 10): Promise<SearchResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  // Fallback: Simple database search instead of Edge Function
  try {
    // Try keyword search in database
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .ilike('title', `%${query}%`)
      .eq('is_archived', false)
      .order('member_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get popular rooms as backup
    const { data: popularRooms } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_archived', false)
      .order('member_count', { ascending: false })
      .limit(5);

    return {
      results: rooms || [],
      popularRooms: popularRooms || [],
      searchType: 'keyword',
      message: rooms && rooms.length > 0 ? undefined : 'No exact matches found'
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export async function createRoom(title: string, description: string, category: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('rooms')
    // @ts-expect-error - Supabase type inference issue
    .insert({
      title,
      description,
      category,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Skip embeddings generation for now (Edge Function not deployed)
  // const text = `${title} ${description}`;
  // const { data: { session } } = await supabase.auth.getSession();
  // if (session) {
  //   await fetch(
  //     `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-embeddings`,
  //     {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${session.access_token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ text, roomId: data.id }),
  //     }
  //   );
  // }

  return data;
}

export async function joinRoom(
  roomId: string,
  displayName: string,
  anonymityLevel: 'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified'
) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('room_memberships')
    // @ts-expect-error - Supabase type inference issue
    .insert({
      user_id: user.id,
      room_id: roomId,
      display_name: displayName,
      anonymity_level: anonymityLevel,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function leaveRoom(roomId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('room_memberships')
    // @ts-expect-error - Supabase type inference issue
    .update({ left_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .is('left_at', null);

  if (error) throw error;
}

export async function getRoom(roomId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error) throw error;
  return data;
}

export async function getRoomMembership(roomId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .is('left_at', null)
    .maybeSingle();

  return data;
}
